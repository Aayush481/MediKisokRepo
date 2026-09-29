/**
 * MediKiosk Multilingual Speech Service
 * Integrates Web Speech API (ASR) + Text-to-Speech (TTS) with Indian Language support
 */

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.currentLanguage = "hi-IN";
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
    } else {
      console.warn("Web Speech API not supported in this browser. Fallback simulation enabled.");
    }
  }

  setLanguage(langCode) {
    const langMap = {
      hi: "hi-IN",
      en: "en-IN",
      bn: "bn-IN",
      ta: "ta-IN",
      te: "te-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      kn: "kn-IN"
    };
    this.currentLanguage = langMap[langCode] || "en-IN";
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  startListening(onInterim, onFinal, onError) {
    if (!this.recognition) {
      if (onError) onError("Web Speech API is unavailable in this environment. Please use touch/type.");
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onInterim && interimTranscript) {
        onInterim(interimTranscript);
      }
      if (onFinal && finalTranscript) {
        onFinal(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.error("Speech start error:", err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, lang = "hi", onEnd = null) {
    if (!("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      hi: "hi-IN",
      en: "en-IN",
      bn: "bn-IN",
      ta: "ta-IN",
      te: "te-IN",
      mr: "mr-IN"
    };
    utterance.lang = langMap[lang] || "en-IN";
    utterance.rate = 0.95; // Slightly slower for clear elderly understanding
    utterance.pitch = 1.0;

    // Pick best matching native voice if available
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const prefix = (langMap[lang] || "en-IN").split("-")[0].toLowerCase();
        const matched = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
        if (matched) {
          utterance.voice = matched;
        }
      }
    } catch (e) {}

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
