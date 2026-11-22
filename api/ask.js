export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (!body) {
      body = {};
    } else if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const lang = body.lang === "en" ? "en" : "hi";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({ error: "Prompt is too long" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "Server AI key not configured",
        fallback: true
      });
    }

    const systemInstruction = [
      "You are KAAMSAATHI (\"Har Samasya Ka Sahi Raasta\"), an India-first everyday problem-solving assistant.",
      "Rules:",
      "1. Reply strictly in " + (lang === "hi" ? "simple everyday Hindi (Devanagari script)" : "simple clear English") + ".",
      "2. You are NOT an official government, bank, court, or service-provider representative. Never claim official status or guarantee refunds, approvals, or outcomes.",
      "3. Never ask for OTP, UPI PIN, ATM PIN, CVV, passwords, or full card/ID numbers.",
      "4. Never invent fake URLs, fake phone numbers, fake deadlines, or unverified legal/financial rules. If unsure, say so clearly and advise checking official channels.",
      "5. Return ONLY valid JSON with these exact keys:",
      "{\"title\":\"short 4-8 word title\",\"problem\":\"one-line clear summary\",\"immediate\":\"first safe practical next step\",\"steps\":\"numbered step-by-step instructions separated by newlines\",\"checklist\":[\"item 1\",\"item 2\"],\"source\":\"official source/channel name and note to verify live portal/rules\",\"warning\":\"risks, fees, deadlines, uncertainty, and OTP/PIN safety note\"}"
    ].join("\n");

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    });

    if (!apiRes.ok) {
      return res.status(502).json({ error: "Upstream AI request failed" });
    }

    const apiData = await apiRes.json();
    const candidate = apiData && apiData.candidates && apiData.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const rawText = part && typeof part.text === "string" ? part.text.trim() : "";

    if (!rawText) {
      return res.status(502).json({ error: "Empty response from AI" });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    const structured = {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : prompt.slice(0, 50),
      problem: typeof parsed.problem === "string" && parsed.problem.trim() ? parsed.problem.trim() : prompt,
      immediate: typeof parsed.immediate === "string" ? parsed.immediate.trim() : "",
      steps: typeof parsed.steps === "string" ? parsed.steps.trim() : "",
      checklist: Array.isArray(parsed.checklist)
        ? parsed.checklist.map((item) => String(item).trim()).filter(Boolean)
        : [],
      source:
        typeof parsed.source === "string" && parsed.source.trim()
          ? parsed.source.trim()
          : "Official channel — verify live portal and rules",
      warning:
        typeof parsed.warning === "string" && parsed.warning.trim()
          ? parsed.warning.trim()
          : "Never share OTP, UPI PIN, ATM PIN, CVV, or passwords."
    };

    return res.status(200).json({ structured });
  } catch (err) {
    return res.status(500).json({ error: "Server error while processing request" });
  }
}
