import type { DealAnalysis } from "../types/domain";

// Optional: provide a Gemini API key and (optionally) override endpoint.
// If `EXPO_PUBLIC_GEMINI_API_KEY` is set, the service will call Gemini first.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const GEMINI_ENDPOINT =
  process.env.EXPO_PUBLIC_GEMINI_ENDPOINT ??
  "https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateText";

// OpenAI settings (kept as a fallback if you prefer OpenAI)
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
const OPENAI_MODEL = "gpt-4o-mini"; // Or gpt-4o for the larger model
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export type DealInput = {
  productName: string;
  currentPrice: number;
  avgPrice: number;
  discountPercent: number;
  priceTrend: "up" | "down" | "stable";
};

export async function analyzeDealWithAI(
  input: DealInput,
): Promise<DealAnalysis> {
  if (!OPENAI_API_KEY) {
    // If Gemini key present, we'll call Gemini below instead of OpenAI.
    // During development, don't hard-fail — return a deterministic mock result
    // so the UI can be tested without an API key. In production you should
    // provide a real EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY
    // and ideally call the API from a secure server.
    console.warn(
      "Missing EXPO_PUBLIC_OPENAI_API_KEY in environment. Returning mock analysis.",
    );

    // Simple heuristic mock: higher discount -> higher score
    const pct = Math.max(0, Math.min(100, input.discountPercent));
    const score = Math.max(1, Math.min(10, Math.round((pct / 30) * 9 + 1)));
    const verdict = score >= 8 ? "Good" : score >= 5 ? "Average" : "Overpriced";
    return {
      dealScore: score,
      verdict,
      explanation: `Mock analysis based on ${pct.toFixed(1)}% discount.`,
    } as unknown as DealAnalysis;
  }

  const systemPrompt = `You are a sports equipment price analyst. Analyze this deal based ONLY on the data provided below. Do NOT invent or assume any information not given.
Respond with ONLY a JSON object in this exact format, no markdown, no extra text:
{
  "dealScore": <number 1-10>,
  "verdict": "<Good | Average | Overpriced>",
  "explanation": "<1-2 sentence explanation in English>"
}`;

  const prompt = `Product: ${input.productName}
Current Best Price: €${input.currentPrice.toFixed(2)}
30-Day Average Price: €${input.avgPrice.toFixed(2)}
Discount from Average: ${input.discountPercent.toFixed(1)}%
Price Trend (last 30 days): ${input.priceTrend}`;

  const body = {
    model: OPENAI_MODEL,
    max_tokens: 256,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  // If a Gemini API key is provided, call Gemini (Google Generative API) first.
  let response: Response | null = null;
  if (GEMINI_API_KEY) {
    try {
      const geminiBody = {
        prompt: `${systemPrompt}\n\n${prompt}`,
        maxOutputTokens: 256,
        temperature: 0.3,
      };

      response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiBody),
      });
    } catch (e) {
      // If Gemini call fails for network reasons, fall back to OpenAI below.
      console.warn("Gemini request failed, will try OpenAI fallback.", e);
      response = null;
    }
  }

  // If we don't have a Gemini response, use OpenAI (if available)
  if (!response) {
    if (!OPENAI_API_KEY) {
      // No provider key available — return the mock (kept behavior)
      const pct = Math.max(0, Math.min(100, input.discountPercent));
      const score = Math.max(1, Math.min(10, Math.round((pct / 30) * 9 + 1)));
      const verdict =
        score >= 8 ? "Good" : score >= 5 ? "Average" : "Overpriced";
      return {
        dealScore: score,
        verdict,
        explanation: `Mock analysis based on ${pct.toFixed(1)}% discount.`,
      } as unknown as DealAnalysis;
    }

    response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status}).`;

    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) {
        errorMessage = errJson.error.message;
      }
    } catch (e) {
      // Ignore JSON parse error, fallback to status
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`OpenAI Authentication Error: ${errorMessage}`);
    }

    if (response.status === 429) {
      throw new Error(`OpenAI Rate Limit Exceeded: ${errorMessage}`);
    }

    throw new Error(
      `OpenAI Service Error (${response.status}): ${errorMessage}`,
    );
  }

  const data = await response.json();

  // Extract raw text from either Gemini or OpenAI response shapes.
  let rawText: string = "";
  // OpenAI chat completion shape
  if (data?.choices?.[0]?.message?.content) {
    rawText = data.choices[0].message.content;
  }
  // Gemini / text-bison shape: often { candidates: [{ output: "..." }] }
  if (!rawText && data?.candidates?.[0]?.output) {
    rawText = data.candidates[0].output;
  }
  // Some Gemini variants use `content` array
  if (!rawText && data?.candidates?.[0]?.content) {
    const first = data.candidates[0].content[0];
    rawText = first?.text ?? first?.output ?? "";
  }

  if (!rawText && typeof data === "string") {
    rawText = data;
  }

  if (!rawText) {
    throw new Error("AI returned an empty response.");
  }

  // Strip markdown backticks if OpenAI somehow returned them despite json_object mode
  rawText = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: DealAnalysis;
  try {
    parsed = JSON.parse(rawText) as DealAnalysis;
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${rawText}`);
  }

  // Validate and clamp
  if (
    typeof parsed.dealScore !== "number" ||
    typeof parsed.verdict !== "string" ||
    typeof parsed.explanation !== "string"
  ) {
    throw new Error("Invalid response structure from OpenAI.");
  }

  parsed.dealScore = Math.max(1, Math.min(10, Math.round(parsed.dealScore)));

  const validVerdicts = ["Good", "Average", "Overpriced"] as const;
  if (!validVerdicts.includes(parsed.verdict as any)) {
    parsed.verdict = "Average";
  }

  return parsed;
}
