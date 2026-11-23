export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, lang } = req.body || {};
    const userQuestion = String(query || "").trim();

    if (!userQuestion) {
      return res.status(400).json({ error: "Question is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing in Vercel Environment Variables",
      });
    }

    const systemInstruction = `You are KAAMSAATHI ("Har Samasya Ka Sahi Raasta"), a helpful, practical everyday problem-solving assistant for Indian users.
Rules:
1. Reply in the SAME language/style the user used (if user writes in Hindi or Hinglish like "Ai se video kaise banay", reply in clear, easy Hinglish/Hindi; if English, reply in clear English).
2. Give direct, practical, accurate, and genuinely useful answers tailored to the exact question—NEVER give generic complaint templates for general how-to, tech, career, study, or creative questions.
3. Safety: Never ask for or encourage sharing OTP, UPI PIN, ATM PIN, CVV, passwords, or Aadhaar/card numbers. Never claim to be an official government or bank portal.
4. Return ONLY valid JSON with these exact keys:
{
  "summary": "1-2 line direct answer/summary of the user's question",
  "safeStep": "Most important first action or safety/smart tip relevant to this exact topic",
  "steps": ["Clear step 1", "Clear step 2", "Clear step 3", "Clear step 4"],
  "checklist": ["Helpful tool/document/point 1", "Helpful tool/document/point 2", "Helpful tool/document/point 3"],
  "officialHelp": "Best verified platform, official app/website, or reliable resource for this topic",
  "warning": "Common mistake or scam to avoid for this topic",
  "nextAction": "What the user should do right now in 1 minute"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `UI Language preference: ${lang || "auto"}\nUser Question: ${userQuestion}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const apiErr = data?.error?.message || "Gemini API request failed";
      return res.status(response.status).json({ error: apiErr });
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText);

    return res.status(200).json({ ok: true, result: parsed });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Server error in /api/ask",
    });
  }
}
