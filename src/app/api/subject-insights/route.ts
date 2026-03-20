import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { subject, topicData, totalQuestions } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const topSummary = topicData
      .slice(0, 8)
      .map((t: { topic: string; total: number }) => `${t.topic}: ${t.total} questions`)
      .join(", ");

    const prompt = `You are an expert UPSC Prelims coach. Analyse this UPSC Prelims PYQ data for the subject: ${subject}.

Total questions (2014-2025): ${totalQuestions}
Top topics by frequency: ${topSummary}

Give a CONCISE, HIGH-VALUE strategic analysis in this EXACT JSON format (no markdown, pure JSON):
{
  "verdict": "One punchy sentence summarising the subject's character in UPSC prelims (max 20 words)",
  "focusTopics": ["Topic1", "Topic2", "Topic3"],
  "avoidTopics": ["Topic1", "Topic2"],
  "studyTip": "One specific, actionable study tip for this subject (max 30 words)",
  "trendInsight": "One sentence on how this subject's pattern has changed recently (max 25 words)",
  "difficultyRating": "Easy | Moderate | Hard",
  "predictedNextYear": "Topic or theme most likely to appear next year in UPSC prelims"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from the response (Gemini sometimes wraps in ```json)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response", raw }, { status: 500 });
    }
    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json(insights);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
