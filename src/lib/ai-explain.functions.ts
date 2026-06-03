import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  name: z.string(),
  scoreCurrent: z.number(),
  score6m: z.number(),
  score12m: z.number(),
  band: z.string(),
  totalLoanOutstanding: z.number(),
  totalCardLimit: z.number(),
  totalCardBalance: z.number(),
  latePayments: z.number(),
  missedPayments: z.number(),
  productMix: z.array(z.string()),
});

export const explainRating = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const util = data.totalCardLimit
      ? Math.round((data.totalCardBalance / data.totalCardLimit) * 100)
      : 0;

    const prompt = `Customer: ${data.name}
Current credit score: ${data.scoreCurrent}/999 (${data.band})
6-month forecast: ${data.score6m} (${data.score6m - data.scoreCurrent >= 0 ? "+" : ""}${data.score6m - data.scoreCurrent})
12-month forecast: ${data.score12m} (${data.score12m - data.scoreCurrent >= 0 ? "+" : ""}${data.score12m - data.scoreCurrent})
Total loan outstanding: $${data.totalLoanOutstanding.toLocaleString()}
Credit card utilization: ${util}% ($${data.totalCardBalance.toLocaleString()} / $${data.totalCardLimit.toLocaleString()})
Late payments (last 12mo): ${data.latePayments}
Missed payments (last 12mo): ${data.missedPayments}
Loan products: ${data.productMix.join(", ")}

In 3-4 short bullet points, explain WHY this customer has this rating and the predicted trajectory. Cite the specific numbers above. Plain text, one bullet per line starting with "• ". No preamble.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior credit risk analyst. Be concise, factual, and reference exact numbers given. Never invent data.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (resp.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!resp.ok) throw new Error(`AI gateway error (${resp.status})`);

    const json = await resp.json();
    const explanation: string = json.choices?.[0]?.message?.content ?? "No explanation returned.";
    return { explanation };
  });
