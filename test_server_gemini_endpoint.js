async function testServerEndpoint() {
  console.log("Testing POST /api/analyze-document on http://localhost:3000 ...");

  // Sample medical report text
  const payload = {
    reportText: "Patient presents with knee pain. X-Ray Bilateral Knee Joint AP view shows joint space narrowing in medial compartment with marginal osteophytes.",
    fileName: "knee_xray_report.jpg",
    mimeType: "image/jpeg"
  };

  try {
    const res = await fetch("http://localhost:3000/api/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (res.status === 200 && data.success) {
      console.log("\n✅ SERVER GEMINI MULTIMODAL ENDPOINT TEST PASSED!");
    } else {
      console.error("\n❌ Endpoint failed");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testServerEndpoint();
