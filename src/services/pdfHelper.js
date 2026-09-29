/**
 * MediKiosk Universal Multi-Page PDF Document & Text Extraction Engine
 * Zero-Dependency Native Stream Extractor + PDF.js High-Resolution Page Rasterizer
 * Accurately extracts full multi-page lab reports, discharge summaries, and prescriptions
 */

export class PDFHelper {
  /**
   * Convert an ArrayBuffer or Blob of a Multi-Page PDF into extracted structured text and rendered Canvas DataURL
   */
  static async processPdfFile(file, onProgress = null) {
    let extractedText = "";
    let previewDataUrl = null;

    if (onProgress) onProgress("Parsing multi-page PDF structure...");

    const arrayBuffer = await file.arrayBuffer();

    // 1. Primary Engine: PDF.js (if available in browser window)
    if (typeof window !== "undefined" && window.pdfjsLib) {
      try {
        if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }

        const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        let pageTexts = [];

        // Extract text from ALL pages (up to 30 pages)
        for (let p = 1; p <= Math.min(30, totalPages); p++) {
          if (onProgress) onProgress(`Reading PDF Page ${p} of ${totalPages}...`);
          const page = await pdfDoc.getPage(p);
          const textContent = await page.getTextContent();
          
          // Reconstruct formatted tabular lines preserving vertical Y alignment
          const sortedItems = [...textContent.items].sort((a, b) => {
            const yA = a.transform ? a.transform[5] : 0;
            const yB = b.transform ? b.transform[5] : 0;
            if (Math.abs(yA - yB) > 3) {
              return yB - yA; // Top to bottom
            }
            const xA = a.transform ? a.transform[4] : 0;
            const xB = b.transform ? b.transform[4] : 0;
            return xA - xB; // Left to right
          });

          let pageLines = [];
          let currentLine = "";
          let lastY = null;

          for (const item of sortedItems) {
            const itemY = item.transform ? Math.round(item.transform[5]) : 0;
            if (lastY !== null && Math.abs(itemY - lastY) > 5) {
              if (currentLine.trim().length > 0) {
                pageLines.push(currentLine.trim());
              }
              currentLine = "";
            }
            currentLine += (currentLine ? "   " : "") + item.str;
            lastY = itemY;
          }
          if (currentLine.trim().length > 0) {
            pageLines.push(currentLine.trim());
          }

          if (pageLines.length > 0) {
            pageTexts.push(`=== [PAGE ${p} OF ${totalPages}] ===\n` + pageLines.join("\n"));
          }

          // Render Page 1 to Canvas for High-Res Thumbnail Preview and Morphology
          if (p === 1 && typeof document !== "undefined") {
            try {
              const viewport = page.getViewport({ scale: 1.5 });
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({ canvasContext: ctx, viewport }).promise;
              previewDataUrl = canvas.toDataURL("image/jpeg", 0.90);
            } catch (renderErr) {
              console.warn("Page 1 preview render note:", renderErr);
            }
          }
        }

        extractedText = pageTexts.join("\n\n");
      } catch (pdfJsErr) {
        console.warn("PDF.js renderer note, falling back to native stream parser:", pdfJsErr);
      }
    }

    // 2. Fallback: Fast Native Binary Text Stream Parser (Zero external dependencies)
    if (!extractedText || extractedText.trim().length < 20) {
      if (onProgress) onProgress("Executing Direct PDF Stream Extraction...");
      const nativeText = this.extractTextFromPdfBuffer(arrayBuffer);
      if (nativeText && nativeText.trim().length > extractedText.trim().length) {
        extractedText = nativeText;
      }
    }

    // If no canvas was rendered, create document placeholder preview
    if (!previewDataUrl && typeof document !== "undefined") {
      previewDataUrl = this.generateDocumentPlaceholder(file.name, extractedText);
    }

    return {
      text: extractedText.trim(),
      previewDataUrl: previewDataUrl || ""
    };
  }

  /**
   * Fast Binary PDF Stream Text Extractor (Parses text blocks from raw PDF byte streams across pages)
   */
  static extractTextFromPdfBuffer(arrayBuffer) {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      let binaryStr = "";
      const chunkSize = 65536;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binaryStr += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }

      const extractedStrings = [];

      // Regex 1: Matches text in parentheses: (Sample Text) Tj
      const tjMatches = binaryStr.matchAll(/\(([^()]{2,160})\)\s*T[jJ]/g);
      for (const m of tjMatches) {
        const clean = m[1].replace(/\\([()\\])/g, "$1").trim();
        if (clean.length > 1 && !extractedStrings.includes(clean)) {
          extractedStrings.push(clean);
        }
      }

      // Regex 2: Matches text inside array brackets: [(Sample) -10 (Text)] TJ
      const arrayMatches = binaryStr.matchAll(/\[(.*?)\]\s*TJ/gi);
      for (const m of arrayMatches) {
        const innerStrings = m[1].matchAll(/\(([^()]+)\)/g);
        let combinedChunk = "";
        for (const strMatch of innerStrings) {
          combinedChunk += strMatch[1].replace(/\\([()\\])/g, "$1") + " ";
        }
        if (combinedChunk.trim().length > 1) {
          extractedStrings.push(combinedChunk.trim());
        }
      }

      // Regex 3: Plain text chunks matching clinical test headers
      const plainTextMatches = binaryStr.match(/[A-Za-z0-9\s.,:\/%_\-+()]{4,120}/g) || [];
      const medicalHints = [
        "glucose", "blood", "report", "pathology", "test", "serum", "patient", "dr.", "mg/dl",
        "hemoglobin", "haemoglobin", "triglyceride", "cholesterol", "creatinine", "tablet", "capsule",
        "rx", "hospital", "clinic", "cbc", "lft", "kft", "rft", "bilirubin", "alt", "ast", "sgpt",
        "sgot", "urea", "uric", "sodium", "potassium", "platelet", "wbc", "rbc", "esr", "thyroid", "tsh"
      ];
      
      for (const chunk of plainTextMatches) {
        const lower = chunk.toLowerCase();
        if (medicalHints.some(hint => lower.includes(hint))) {
          if (!extractedStrings.includes(chunk.trim())) {
            extractedStrings.push(chunk.trim());
          }
        }
      }

      return extractedStrings.join("\n");
    } catch (e) {
      console.warn("Native PDF stream parse notice:", e);
      return "";
    }
  }

  /**
   * Generates a clean document paper preview dataURL if canvas rasterizer is unavailable
   */
  static generateDocumentPlaceholder(fileName, textSnippet) {
    if (typeof document === "undefined") return "";
    const canvas = document.createElement("canvas");
    canvas.width = 450;
    canvas.height = 550;
    const ctx = canvas.getContext("2d");

    // White paper background with header bar
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 450, 550);

    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, 450, 60);

    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("📄 Digitized Clinical Multi-Page PDF", 20, 36);

    ctx.fillStyle = "#64748B";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(fileName.length > 42 ? fileName.slice(0, 39) + "..." : fileName, 20, 85);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 95);
    ctx.lineTo(430, 95);
    ctx.stroke();

    // Render lines of text snippet
    ctx.fillStyle = "#334155";
    ctx.font = "11px monospace";
    const lines = (textSnippet || "Multi-page clinical data digitized successfully.").split("\n").slice(0, 22);
    let y = 120;
    for (const line of lines) {
      ctx.fillText(line.slice(0, 50), 20, y);
      y += 18;
      if (y > 520) break;
    }

    return canvas.toDataURL("image/jpeg", 0.85);
  }
}

export default PDFHelper;
