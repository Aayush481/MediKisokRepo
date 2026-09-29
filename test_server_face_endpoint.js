import http from "http";
import fs from "fs";

console.log("=== RUNNING SERVER FACE DETECTOR ENDPOINT TESTS ===\n");

// Helper function to test status endpoint
function testStatusEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get("http://localhost:3000/api/face-detector-status", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log("TEST 1: GET /api/face-detector-status");
          console.log("  Response:", json);
          if (json.status === "active" && json.pythonAvailable) {
            console.log("  Result: PASSED\n");
            resolve(true);
          } else {
            reject(new Error("Status response missing active status or pythonAvailable"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
  });
}

// Helper function to test detect-face endpoint
function testDetectFaceEndpoint() {
  return new Promise((resolve, reject) => {
    // 1x1 transparent PNG / blank base64
    const samplePayload = JSON.stringify({
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    });

    const req = http.request("http://localhost:3000/api/detect-face", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(samplePayload)
      }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log("TEST 2: POST /api/detect-face with blank frame");
          console.log("  Response:", json);
          // Blank image should return detected: false
          if (json.detected === false || json.valid === false) {
            console.log("  Result: PASSED (Blank Image Correctly Handled)\n");
            resolve(true);
          } else {
            reject(new Error("Unexpected detection for blank frame"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(samplePayload);
    req.end();
  });
}

async function runTests() {
  try {
    await testStatusEndpoint();
    await testDetectFaceEndpoint();
    console.log("🎉 ALL SERVER FACE DETECTOR ENDPOINT TESTS PASSED!");
  } catch (err) {
    console.error("Endpoint test error:", err);
    process.exit(1);
  }
}

runTests();
