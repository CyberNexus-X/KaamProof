import type { Assessment, Criterion, Evidence, Task } from "../types";
import { validateAssessment } from "./schema";
import { buildAssessmentPrompt, PROMPT_VERSION } from "./prompt";

export interface AssessmentInput { task: Task; criteria: Criterion[]; evidence: Evidence[]; }
export interface AiAdapter { provider: string; model: string; assess(input: AssessmentInput): Promise<Omit<Assessment, "id" | "project_id" | "task_id" | "created_at">>; }

// Deterministic mock (PRD §22 demo): 0 evidence -> insufficient; 1-3 -> insufficient
// with only the first criterion supported; >=4 -> supported. No invented confidence,
// no fraud/authenticity/safety claims. Used when no AI key is configured.
export class MockAdapter implements AiAdapter {
  provider = "mock"; model = "mock-deterministic-v1";
  async assess({ task, criteria, evidence }: AssessmentInput) {
    const n = evidence.length;
    const ids = evidence.map((e) => e.id);
    const results = criteria.map((c, i) => {
      if (n === 0) return { criterion_id: c.id, finding: "insufficient_evidence" as const, explanation: "No evidence was submitted for this criterion, so it cannot be assessed.", evidence_ids: [], limitations: ["No images submitted."] };
      if (i === 0 && n >= 1) return { criterion_id: c.id, finding: "supported_by_evidence" as const, explanation: "The submitted photograph(s) visibly show this aspect of the task.", evidence_ids: ids, limitations: [] };
      if (n >= 4) return { criterion_id: c.id, finding: "supported_by_evidence" as const, explanation: "The submitted photographs visibly cover this criterion.", evidence_ids: ids, limitations: [] };
      return { criterion_id: c.id, finding: "insufficient_evidence" as const, explanation: "The submitted photographs do not show all areas this criterion requires.", evidence_ids: ids, limitations: ["Additional photographs showing the remaining areas are needed."] };
    });
    const overall = n >= 4 ? "supported" as const : "insufficient_evidence" as const;
    const missing = n >= 4 ? [] : ["Photographs showing the remaining wall surfaces and corners."];
    const out = { overall_status: overall, criteria: results, missing_evidence: missing, limitations: ["This is an advisory assessment of the submitted images only. It is not a certification of workmanship, safety, or legal compliance.", "Upload time is not proof of capture time."], recommended_next_action: n >= 4 ? "review_and_decide" : "request_more_evidence" };
    const v = validateAssessment(out);
    if (!v.ok) throw new Error(v.error);
    return { status: "completed" as const, overall_finding: v.data.overall_status, model_provider: this.provider, model_identifier: this.model, prompt_version: PROMPT_VERSION, input_evidence_ids: ids, criteria: v.data.criteria, missing_evidence: v.data.missing_evidence, limitations: v.data.limitations, recommended_next_action: v.data.recommended_next_action, task_version_id: String(task.current_version), error_code: null, completed_at: new Date().toISOString() };
  }
}

// Server-only OpenAI adapter. The key is read from env on the server and never
// sent to the client. Falls back to an error (never approval) on failure.
export class OpenAIAdapter implements AiAdapter {
  provider = "openai"; model = process.env.AI_MODEL || "gpt-4o-mini";
  async assess({ task, criteria, evidence }: AssessmentInput) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    const prompt = buildAssessmentPrompt(task.title, task.description, criteria, evidence);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return only valid JSON for the KaamProof assessment schema." }, { role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`AI provider error: ${res.status}`);
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown; try { parsed = JSON.parse(raw); } catch { throw new Error("AI returned malformed JSON"); }
    const v = validateAssessment(parsed);
    if (!v.ok) throw new Error(v.error);
    return { status: "completed" as const, overall_finding: v.data.overall_status, model_provider: this.provider, model_identifier: this.model, prompt_version: PROMPT_VERSION, input_evidence_ids: evidence.map((e) => e.id), criteria: v.data.criteria, missing_evidence: v.data.missing_evidence, limitations: v.data.limitations, recommended_next_action: v.data.recommended_next_action, task_version_id: String(task.current_version), error_code: null, completed_at: new Date().toISOString() };
  }
}
export function getAdapter(): AiAdapter {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) return new OpenAIAdapter();
  return new MockAdapter();
}
