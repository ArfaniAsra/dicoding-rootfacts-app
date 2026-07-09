import { pipeline, env } from "@huggingface/transformers";
import { isWebGPUSupported, logError } from "../utils/index.js";

env.backends.onnx.wasm.wasmPaths = "/ort/";

const TONE_DESCRIPTORS = {
  normal: "interesting",
  funny: "funny and humorous",
  professional: "formal and scientific",
  casual: "casual and friendly, like chatting with a friend",
};

const INDONESIAN_MARKERS = ["yang", "adalah", "dan", "untuk", "dengan", "atau", "dari", "pada", "akan", "sayuran", "ini", "itu", "juga", "sangat"];

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = "normal";
  }

  async loadModel(onProgress) {
    const preferWebGPU = isWebGPUSupported();
    const progressOptions = {
      dtype: "q4",
      progress_callback: (data) => {
        if (onProgress && data.status === "progress") {
          onProgress(Math.round(data.progress));
        }
      },
    };

    try {
      this.generator = await pipeline("text2text-generation", "Xenova/flan-t5-small", preferWebGPU ? { ...progressOptions, device: "webgpu" } : progressOptions);
      this.currentBackend = preferWebGPU ? "webgpu" : "wasm";
    } catch (error) {
      logError("Gagal memuat model dengan WebGPU, fallback ke WASM", error);
      this.generator = await pipeline("text2text-generation", "Xenova/flan-t5-small", progressOptions);
      this.currentBackend = "wasm";
    }

    this.isModelLoaded = true;
    return true;
  }

  setTone(tone) {
    this.currentTone = tone;
  }

  #sanitizeInput(text) {
    return text
      .replace(/[^a-zA-Z\s]/g, "")
      .trim()
      .slice(0, 50);
  }

  #buildPrompt(vegetable, tone) {
    const descriptor = TONE_DESCRIPTORS[tone] || TONE_DESCRIPTORS.normal;
    return `Write one ${descriptor} sentence in English about the vegetable ${vegetable}. Mention only real facts about ${vegetable}, such as its taste, nutrition, or common use. Respond only in English. Do not repeat words.`;
  }

  #containsIndonesian(text) {
    const lower = text.toLowerCase();
    return INDONESIAN_MARKERS.some((word) => new RegExp(`\\b${word}\\b`).test(lower));
  }

  #hasRepetition(text) {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (sentences.length > 1 && new Set(sentences).size < sentences.length) {
      return true;
    }

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    if (words.length < 8) return false;

    const uniqueRatio = new Set(words).size / words.length;
    return uniqueRatio < 0.6;
  }

  #isValidOutput(text, vegetable) {
    if (!text || text.trim().length < 5) return false;
    if (!text.toLowerCase().includes(vegetable.toLowerCase())) return false;
    if (this.#hasRepetition(text)) return false;
    if (this.#containsIndonesian(text)) return false;
    return true;
  }

  #fallbackFact(vegetable) {
    return `${vegetable} adalah sayuran bergizi yang umum digunakan dalam berbagai masakan sehari-hari.`;
  }

  async generateFacts(vegetable, tone) {
    if (!this.isReady()) {
      throw new Error("Model Generative AI belum siap");
    }

    const cleanVegetable = this.#sanitizeInput(vegetable);
    if (!cleanVegetable) {
      throw new Error("Nama sayuran tidak valid");
    }

    const activeTone = tone || this.currentTone;
    const prompt = this.#buildPrompt(cleanVegetable, activeTone);

    const strategies = [
      { do_sample: false, num_beams: 4 },
      { do_sample: true, temperature: 0.3, top_p: 0.85 },
      { do_sample: true, temperature: 0.6, top_p: 0.9 },
      { do_sample: true, temperature: 0.8, top_p: 0.95 },
    ];

    this.isGenerating = true;

    try {
      for (let attempt = 0; attempt < strategies.length; attempt++) {
        const output = await this.generator(prompt, {
          max_new_tokens: 50,
          repetition_penalty: 1.3,
          no_repeat_ngram_size: 3,
          ...strategies[attempt],
        });

        const text = output[0].generated_text.trim();

        if (this.#isValidOutput(text, cleanVegetable)) {
          return text;
        }

        logError(`Percobaan ${attempt + 1} tidak valid untuk "${cleanVegetable}"`, text);
      }

      return this.#fallbackFact(cleanVegetable);
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}

export default RootFactsService;
