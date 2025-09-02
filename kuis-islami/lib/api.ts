// lib/api.ts
const BASE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

async function callFn<T>(path: string, body?: any, method: "POST" | "GET" = "POST"): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON}`,
    },
    ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
  });
  if (!res.ok) {
    let errText = await res.text().catch(() => "");
    try {
      const j = JSON.parse(errText);
      errText = j.error || j.message || errText;
    } catch {}
    throw new Error(errText || `${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function startSession(params: {
  level: number;
  name: string;
  phone: string;
}) {
  return callFn<{ session_id: string; level: number; question_ids: number[] }>("start_session", params);
}

export async function getQuestions(params: { sessionId: string }) {
  return callFn<{ questions: { id: number; text: string; options: string[]; correct_index?: number }[]; video_url?: string }>(
    "get_questions",
    { session_id: params.sessionId }
  );
}

export async function submitAnswer(params: {
  sessionId: string;
  questionId: number;
  options: string[];
  chosenIndex: number;
  elapsedMs: number;
}) {
  return callFn<{ correct: boolean; correct_index: number; score_delta: number; finished: boolean }>(
    "submit_answer",
    {
      session_id: params.sessionId,
      question_id: params.questionId,
      options: params.options,
      chosen_index: params.chosenIndex,
      time_spent_ms: params.elapsedMs,
    }
  );
}

export async function finalizeSession(sessionId: string) {
  return callFn<{ correct_count: number; bonus_count: number; total_points: number; total_time_ms: number; finished_at: string }>(
    "finalize_session",
    { session_id: sessionId }
  );
}
