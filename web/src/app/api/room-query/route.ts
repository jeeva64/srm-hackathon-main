/**
 * POST /api/room-query  { text: string, today: "YYYY-MM-DD", now: "HH:MM" }
 *   -> { query: RoomQuery, understood: string[], source: "ai" | "rules", reason?: string }
 *
 * The LLM only turns the sentence into filters. Room availability is computed on the client
 * with findRooms() from the timetable, so the AI can never invent a room.
 * No key or bounded AI failure => deterministic rule parser (the app keeps working).
 * GEMINI_API_KEY stays on the server (never NEXT_PUBLIC_).
 */
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseRoomQuery, normalizeRoomQuery, describeQuery, roomQuerySystemPrompt, ROOM_QUERY_JSON_SCHEMA } from "@/lib/roomQuery";
import { weekdayOf } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/, HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ATTEMPT_TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 800;
const TOTAL_AI_BUDGET_MS = 10500;

type AiFailure = { kind: "status" | "timeout" | "error"; status?: number };
type AiResult = { text: string } | AiFailure;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function statusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { status?: unknown; code?: unknown; error?: { status?: unknown; code?: unknown } };
  const candidate = value.status ?? value.code ?? value.error?.status ?? value.error?.code;
  return typeof candidate === "number" ? candidate : undefined;
}

function failureFrom(error: unknown): AiFailure {
  if (error instanceof Error && error.message === "timeout") return { kind: "timeout" };
  const status = statusCode(error);
  return status ? { kind: "status", status } : { kind: "error" };
}

function fallbackResponse(text: string, today: string, now: string, reason: string) {
  const parsed = parseRoomQuery(text, today, now);
  return NextResponse.json({ ...parsed, reason });
}

async function generateWithRetry(ai: GoogleGenAI, model: string, text: string, today: string, now: string, deadline: number): Promise<AiResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { kind: "timeout" };
    try {
      const call = ai.models.generateContent({
        model,
        contents: text,
        config: {
          systemInstruction: roomQuerySystemPrompt(today, now, weekdayOf(today)),
          responseMimeType: "application/json",
          responseJsonSchema: ROOM_QUERY_JSON_SCHEMA,
          temperature: 0,
        },
      });
      const response = await Promise.race([
        call,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), Math.min(ATTEMPT_TIMEOUT_MS, remaining))),
      ]);
      return { text: response.text ?? "{}" };
    } catch (error) {
      const failure = failureFrom(error);
      if ((failure.status === 503 || failure.status === 429) && attempt === 0 && Date.now() + RETRY_DELAY_MS < deadline) {
        await wait(RETRY_DELAY_MS);
        continue;
      }
      return failure;
    }
  }
  return { kind: "error" };
}

function failureReason(failure: AiFailure): string {
  if (failure.kind === "timeout") return "timeout";
  if (failure.status === 503 || failure.status === 429) return "ai_busy";
  return "ai_error";
}

function isAiSuccess(result: AiResult): result is { text: string } {
  return "text" in result;
}

export async function POST(req: Request) {
  let body: { text?: unknown; today?: unknown; now?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
  const today = typeof body.today === "string" && ISO.test(body.today) ? body.today : null;
  const now = typeof body.now === "string" && HHMM.test(body.now) ? body.now : null;
  if (!text || !today || !now) return NextResponse.json({ error: "text, today (YYYY-MM-DD) and now (HH:MM) are required" }, { status: 400 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallbackResponse(text, today, now, "no_key");

  const primaryModel = process.env.GEMINI_MODEL?.trim();
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL?.trim();
  if (!primaryModel) return fallbackResponse(text, today, now, "ai_error");

  const ai = new GoogleGenAI({ apiKey: key });
  const deadline = Date.now() + TOTAL_AI_BUDGET_MS;
  let failure = await generateWithRetry(ai, primaryModel, text, today, now, deadline);
  if (isAiSuccess(failure)) {
    try {
      const query = normalizeRoomQuery(JSON.parse(failure.text));
      return NextResponse.json({ query, understood: describeQuery(query, now), source: "ai" as const });
    } catch {
      failure = { kind: "error" };
    }
  }

  if (!isAiSuccess(failure) && Date.now() < deadline && fallbackModel && fallbackModel !== primaryModel && (failure.status === 503 || failure.status === 404)) {
    failure = await generateWithRetry(ai, fallbackModel, text, today, now, deadline);
    if (isAiSuccess(failure)) {
      try {
        const query = normalizeRoomQuery(JSON.parse(failure.text));
        return NextResponse.json({ query, understood: describeQuery(query, now), source: "ai" as const });
      } catch {
        failure = { kind: "error" };
      }
    }
  }

  const reason = failureReason(failure);
  console.warn(`room-query AI failed, using rules: ${reason}`);
  return fallbackResponse(text, today, now, reason);
}
