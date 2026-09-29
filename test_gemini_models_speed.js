import 'dotenv/config';
const key = process.env.GOOGLE_API_KEY || "";
const models = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest"
];

async function benchmark() {
  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      });
      const data = await res.json();
      console.log(`${m}: status=${res.status} elapsed=${Date.now() - start}ms error=${data?.error?.message || "none"}`);
    } catch (e) {
      console.log(`${m}: FAILED ${e.message}`);
    }
  }
}
benchmark();
