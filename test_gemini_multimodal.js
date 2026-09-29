import 'dotenv/config';
const API_KEY = process.env.GOOGLE_API_KEY || "";

async function testMultimodal() {
  console.log("Testing Multimodal Vision with Gemini 3.5-Flash...");
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  // 1x1 test image or sample base64 image
  const sampleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const prompt = `You are a medical report synthesis assistant.
Analyze the information supplied by the user.

Determine what type of medical report it contains.
Extract only information that is actually visible or present in the attachment.
Structure the response as:
## Report Type
## Extracted Findings
## Measurements
## AI Summary
## Limitations

Always finish with: **NOT FOR CLINICAL USE WITHOUT PHYSICIAN REVIEW**`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: sampleImageBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    if (res.status === 200) {
      console.log("Multimodal Response:\n", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("Error:", JSON.stringify(data));
    }
  } catch (e) {
    console.log("Exception:", e.message);
  }
}

testMultimodal();
