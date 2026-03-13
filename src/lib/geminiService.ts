import type { DealAnalysis } from "../types/domain";
import { GoogleGenAI } from "@google/genai";

// Optional: provide a Gemini API key and (optionally) override endpoint.
// If `EXPO_PUBLIC_GEMINI_API_KEY` is set, the service will call Gemini first.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

// OpenAI settings (kept as a fallback if you prefer OpenAI)
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
const OPENAI_MODEL = "gpt-4o-mini"; // Or gpt-4o for the larger model
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export type StoreOffer = {
  storeName: string;
  currentPrice: number;
  shippingCost?: number;
  inStock: boolean;
  trustRating: number; // 1-10
};

export type DealInput = {
  productName: string;
  avgPrice: number;
  priceTrend: "up" | "down" | "stable";
  storeOffers: StoreOffer[];
};

export async function analyzeDealWithAI(
  input: DealInput,
): Promise<DealAnalysis> {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    // During development, don't hard-fail — return a deterministic mock result
    // so the UI can be tested without an API key. In production you should
    // provide a real EXPO_PUBLIC_OPENAI_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY
    console.warn(
      "Missing AI API Keys in environment. Returning mock analysis.",
    );

    // Simple heuristic mock: just pick the first store and mock a result
    const bestOffer = input.storeOffers[0];
    const score = bestOffer ? 8 : 5;
    const verdict = score >= 8 ? "Good" : score >= 5 ? "Average" : "Overpriced";
    return {
      dealScore: score,
      verdict,
      explanation: `Mock analysis assuming ${bestOffer?.storeName || "Unknown"} has a good deal.`,
      recommendedStore: bestOffer?.storeName || "Unknown Store",
      recommendationReason: "This is a mock response, picked the first store.",
      storeComparisons: input.storeOffers.map((o) => ({
        store: o.storeName,
        pros: o.inStock ? "In stock" : "Out of stock",
        cons: o.shippingCost ? `Shipping: €${o.shippingCost}` : "No obvious cons",
      })),
    } as unknown as DealAnalysis;
  }

  const systemPrompt = `You are a sports equipment purchasing advisor. Analyze the given store offers based on total cost (price + shipping), in-stock status, and store trust rating. Compare them and recommend the BEST place to buy.
Respond with ONLY a JSON object in this exact format, no markdown:
{
  "dealScore": <number 1-10, rating the recommended deal itself>,
  "verdict": "<Good | Average | Overpriced>",
  "explanation": "<1-2 sentence overall explanation>",
  "recommendedStore": "<Store name to recommend>",
  "recommendationReason": "<Why this store was chosen over others>",
  "storeComparisons": [
    { "store": "<Store Name>", "pros": "<Pros of this offer>", "cons": "<Cons of this offer>" }
  ]
}`;

  const offersText = input.storeOffers
    .map(
      (o) =>
        `- ${o.storeName}: €${o.currentPrice} (Shipping: €${o.shippingCost || 0}, Trust: ${o.trustRating}/10, In Stock: ${o.inStock})`,
    )
    .join("\n");

  const prompt = `Product: ${input.productName}
30-Day Average Price: €${input.avgPrice.toFixed(2)}
Price Trend (last 30 days): ${input.priceTrend}

Store Offers:
${offersText}`;

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

  // If a Gemini API key is provided, call Gemini SDK first.
  let responseText: string | null = null;
  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 2048, // increased to avoid cutting off JSON mid-generation
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });
      responseText = response.text || null;
    } catch (e) {
      // If Gemini call fails for network reasons, fall back to OpenAI below.
      console.warn("Gemini request failed, will try OpenAI fallback.", e);
    }
  }

  // If we don't have a Gemini response, use OpenAI (if available)
  let response: Response | null = null;
  if (!responseText) {
    if (!OPENAI_API_KEY) {
      // No provider key available — return the mock (kept behavior)
      const bestOffer = input.storeOffers[0];
      const score = bestOffer ? 8 : 5;
      const verdict = score >= 8 ? "Good" : score >= 5 ? "Average" : "Overpriced";
      return {
        dealScore: score,
        verdict,
        explanation: `Mock analysis assuming ${bestOffer?.storeName || "Unknown"} has a good deal.`,
        recommendedStore: bestOffer?.storeName || "Unknown Store",
        recommendationReason: "This is a mock response, picked the first store.",
        storeComparisons: input.storeOffers.map((o) => ({
          store: o.storeName,
          pros: o.inStock ? "In stock" : "Out of stock",
          cons: o.shippingCost ? `Shipping: €${o.shippingCost}` : "No obvious cons",
        })),
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

    let rawText: string = "";
    
    if (response) {
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

      // OpenAI chat completion shape
      if (data?.choices?.[0]?.message?.content) {
        rawText = data.choices[0].message.content;
      }
    }

    responseText = rawText;
  }

  if (!responseText) {
    throw new Error("AI returned an empty response.");
  }

  // Strip markdown backticks if OpenAI somehow returned them despite json_object mode
  let rawText = responseText
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
