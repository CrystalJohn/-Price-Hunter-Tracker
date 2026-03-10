import type { DealAnalysis } from "../types/domain";

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
    throw new Error("Missing EXPO_PUBLIC_OPENAI_API_KEY in environment.");
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

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

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

    throw new Error(`OpenAI Service Error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  let rawText: string = data?.choices?.[0]?.message?.content ?? "";

  if (!rawText) {
    throw new Error("AI returned an empty response.");
  }

  // Strip markdown backticks if OpenAI somehow returned them despite json_object mode
  rawText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

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
