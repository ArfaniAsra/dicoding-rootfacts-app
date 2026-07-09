import { pipeline, env } from "@huggingface/transformers";
import { isWebGPUSupported, logError } from "../utils/index.js";

env.backends.onnx.wasm.wasmPaths = "/ort/";

const TONE_INSTRUCTIONS = {
  normal: "Tell me one short, interesting fun fact",
  funny: "Tell me one short, funny and humorous fun fact, like a light joke",
  professional: "Provide one short, formal and scientific fact",
  casual: "Tell me one short, casual fun fact, like chatting with a friend",
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
    const instruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.normal;
    return `${instruction} about ${vegetable}. Keep it to one or two sentences.`;
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
    this.isGenerating = true;

    try {
      const prompt = this.#buildPrompt(cleanVegetable, activeTone);

      const output = await this.generator(prompt, {
        max_new_tokens: 150,
        temperature: 0.8,
        top_p: 0.9,
        do_sample: true,
      });

      return output[0].generated_text.trim();
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}

export default RootFactsService;
