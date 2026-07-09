import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import { isWebGPUSupported, logError } from "../utils/index.js";

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.currentBackend = null;
    this.performanceStats = {
      operations: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }

  async #setupBackend() {
    if (isWebGPUSupported()) {
      try {
        await tf.setBackend("webgpu");
        await tf.ready();
        this.currentBackend = "webgpu";
        return;
      } catch (error) {
        logError("WebGPU gagal diinisialisasi, fallback ke WebGL", error);
      }
    }
    await tf.setBackend("webgl");
    await tf.ready();
    this.currentBackend = "webgl";
  }

  async loadModel(onProgress) {
    await this.#setupBackend();

    const modelUrl = "/model/model.json";
    const metadataUrl = "/model/metadata.json";

    const [model, metadataResponse] = await Promise.all([
      tf.loadLayersModel(modelUrl, {
        onProgress: (fraction) => {
          if (onProgress) onProgress(Math.round(fraction * 100));
        },
      }),
      fetch(metadataUrl).then((res) => res.json()),
    ]);

    this.model = model;
    this.labels = metadataResponse.labels;

    // Warm-up: jalankan 1 prediksi dummy supaya prediksi pertama pengguna tidak lambat
    const warmupResult = this.model.predict(tf.zeros([1, 224, 224, 3]));
    warmupResult.dispose();

    return true;
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error("Model belum dimuat");
    }

    const startTime = performance.now();

    const input = tf.tidy(() => {
      const offset = tf.scalar(127.5);
      return tf.browser.fromPixels(imageElement).resizeBilinear([224, 224]).toFloat().sub(offset).div(offset).expandDims(0);
    });

    const prediction = this.model.predict(input);
    const scores = await prediction.data();

    input.dispose();
    prediction.dispose();

    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);
    const confidence = Math.round(maxScore * 100);

    const elapsed = performance.now() - startTime;
    this.performanceStats.operations += 1;
    this.performanceStats.totalTime += elapsed;
    this.performanceStats.averageTime = this.performanceStats.totalTime / this.performanceStats.operations;

    return {
      label: this.labels[maxIndex],
      confidence,
      isValid: true,
    };
  }
}

export default DetectionService;
