import 'dotenv/config';
const API_KEY = process.env.GOOGLE_API_KEY || "";

async function testGenerate() {
  const modelsToTest = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"];

  for (const model of modelsToTest) {
    console.log(`\nTesting model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Hello! Analyze this medical case: Patient with fasting blood sugar 240 mg/dL. Provide report type, key findings, and physician review summary." }]
            }
          ]
        })
      });
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        console.log("Response text:\n", data.candidates?.[0]?.content?.parts?.[0]?.text);
        return model;
      } else {
        console.log("Error:", JSON.stringify(data));
      }
    } catch (e) {
      console.log("Exception:", e.message);
    }
  }
}

testGenerate();
