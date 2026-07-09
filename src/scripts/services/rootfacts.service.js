import { pipeline, env } from "@huggingface/transformers";
import { isWebGPUSupported, logError } from "../utils/index.js";

env.backends.onnx.wasm.wasmPaths = "/ort/";

const TONE_DESCRIPTORS = {
  normal: "an interesting",
  funny: "a funny and humorous",
  professional: "a formal and scientific",
  casual: "a casual, friendly",
};

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
    return `Describe the vegetable ${vegetable} in ${descriptor} way with one sentence, focusing only on facts about ${vegetable} such as its taste, nutrition, or common use.`;
  }

  #isRelevant(text, vegetable) {
    if (!text || text.trim().length < 5) return false;
    return text.toLowerCase().includes(vegetable.toLowerCase());
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
    const maxAttempts = 3;

    this.isGenerating = true;

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const output = await this.generator(prompt, {
          max_new_tokens: 100,
          temperature: 0.4,
          top_p: 0.85,
          do_sample: true,
        });

        const text = output[0].generated_text.trim();

        if (this.#isRelevant(text, cleanVegetable)) {
          return text;
        }

        logError(`Percobaan ${attempt}: output AI tidak relevan dengan "${cleanVegetable}"`, text);
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
