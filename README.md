# KAAMSAATHI — Har Samasya Ka Sahi Raasta

India-first bilingual (**Hindi + English**) everyday problem-solving assistant.

## Important Safety & Disclaimer
- KAAMSAATHI is **not** an official government, bank, court, or service-provider app.
- Never ask for or share **OTP, UPI PIN, ATM PIN, CVV, passwords, or full card/ID numbers**.
- Never hardcode API keys or secrets inside code files.

## Project Files
- `index.html` — Mobile-first bilingual UI, 5 tabs (*Home, Ask AI, My Cases, Guides, Profile*), 7-point structured response card, case tracking, guides, and safe ad slot.
- `api/ask.js` — Serverless AI endpoint reading `GEMINI_API_KEY` from environment variables.
- `package.json` — Project configuration and Node runtime setup.
- `.gitignore` — Keeps `.env`, secrets, and local/build files out of GitHub.
- `capacitor.config.json` — Android wrapper configuration (`com.kaamsaathi.app`).
- `.github/workflows/android-build.yml` — Manual GitHub Actions check/build workflow.

## Safe Testing & Rollout
1. Upload the project files to your GitHub repository.
2. Connect to a hosting platform that supports `/api` endpoints and environment variables, and add `GEMINI_API_KEY` in its environment settings.
3. Test with a small pilot group first to check accuracy, privacy, and mobile layout before wider release, ad mediation, or Play Store submission.
