import { generateCameraSection, generateInfoPanel, generateFooter } from "../../templates.js";
import CameraService from "../../services/camera.service.js";
import DetectionService from "../../services/detection.service.js";
import RootFactsService from "../../services/rootfacts.service.js";
import { hideElement, showElement, setElementText, getCameraErrorMessage, isValidDetection, getConfidenceCardClass } from "../../utils/index.js";

export default class HomePage {
  #cameraService = new CameraService();
  #detectionService = new DetectionService();
  #rootFactsService = new RootFactsService();

  #detectionInterval = null;
  #isDetecting = false;
  #isProcessingResult = false;
  #currentFPS = 30;
  #lastResultLabel = null;

  async render() {
    return `
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
  }

  async afterRender() {
    this.#setStatus("Menyiapkan Model AI... 0%");

    const progress = { detection: 0, facts: 0 };
    const updateCombinedProgress = () => {
      const avg = Math.round((progress.detection + progress.facts) / 2);
      this.#setStatus(`Menyiapkan Model AI... ${avg}%`);
    };

    let detectionReady = false;

    try {
      const results = await Promise.allSettled([
        this.#detectionService.loadModel((percent) => {
          progress.detection = percent;
          updateCombinedProgress();
        }),
        this.#rootFactsService.loadModel((percent) => {
          progress.facts = percent;
          updateCombinedProgress();
        }),
      ]);

      detectionReady = results[0].status === "fulfilled";
      const factsReady = results[1].status === "fulfilled";

      if (!detectionReady) {
        console.error("Gagal memuat model deteksi:", results[0].reason);
        this.#setStatus("Gagal Memuat Model Deteksi");
        return;
      }

      this.#setStatus(factsReady ? "Model Siap" : "Model Siap (Fun Fact Tidak Tersedia)");

      if (!factsReady) {
        console.error("Gagal memuat model Generative AI:", results[1].reason);
      }
    } catch (error) {
      this.#setStatus("Gagal Memuat Model");
      console.error(error);
      return;
    }

    this.#bindEvents();
  }

  #setStatus(text) {
    setElementText(document.querySelector("#status-text"), text);
  }

  #bindEvents() {
    const btnToggle = document.querySelector("#btn-toggle");
    const cameraSelect = document.querySelector("#camera-select");
    const fpsSlider = document.querySelector("#fps-slider");
    const fpsLabel = document.querySelector("#fps-label");
    const toneSelect = document.querySelector("#tone-select");
    const btnCopy = document.querySelector("#btn-copy");

    btnToggle.addEventListener("click", async () => {
      if (this.#isDetecting) {
        this.#stopDetection();
      } else {
        await this.#startDetection(cameraSelect);
      }
    });

    fpsSlider.addEventListener("input", (event) => {
      this.#currentFPS = Number(event.target.value);
      fpsLabel.textContent = `${this.#currentFPS} FPS`;
      if (this.#isDetecting) {
        this.#restartDetectionLoop();
      }
    });

    toneSelect.addEventListener("change", (event) => {
      this.#rootFactsService.setTone(event.target.value);
    });

    btnCopy.addEventListener("click", () => this.#handleCopy());
  }

  async #startDetection(cameraSelect) {
    try {
      await this.#cameraService.startCamera("media-video", "media-canvas", cameraSelect);
    } catch (error) {
      alert(getCameraErrorMessage(error));
      return;
    }

    hideElement(document.querySelector("#camera-placeholder"));
    this.#isDetecting = true;
    this.#showState("loading");
    this.#restartDetectionLoop();
  }

  #stopDetection() {
    this.#isDetecting = false;
    this.#lastResultLabel = null;
    clearInterval(this.#detectionInterval);
    this.#cameraService.stopCamera();
    showElement(document.querySelector("#camera-placeholder"));
    this.#showState("idle");
  }

  #restartDetectionLoop() {
    clearInterval(this.#detectionInterval);
    const intervalMs = 1000 / this.#currentFPS;

    this.#detectionInterval = setInterval(async () => {
      if (!this.#cameraService.isActive() || this.#isProcessingResult) return;

      const video = document.querySelector("#media-video");
      const result = await this.#detectionService.predict(video);

      if (isValidDetection(result)) {
        if (result.label !== this.#lastResultLabel) {
          await this.#handleNewDetection(result);
        } else {
          this.#updateConfidenceOnly(result);
        }
      } else if (this.#lastResultLabel !== null) {
        this.#lastResultLabel = null;
        this.#showState("loading");
      }
    }, intervalMs);
  }

  async #handleNewDetection(result) {
    this.#isProcessingResult = true;
    this.#lastResultLabel = result.label;

    this.#showState("result");
    setElementText(document.querySelector("#detected-name"), result.label);
    this.#updateConfidenceOnly(result);

    hideElement(document.querySelector("#fun-fact-content"));
    showElement(document.querySelector("#fun-fact-loading"));

    try {
      const fact = await this.#rootFactsService.generateFacts(result.label);
      setElementText(document.querySelector("#fun-fact-text"), fact);
    } catch (error) {
      setElementText(document.querySelector("#fun-fact-text"), "Gagal membuat fakta menarik. Coba lagi.");
      console.error(error);
    } finally {
      hideElement(document.querySelector("#fun-fact-loading"));
      showElement(document.querySelector("#fun-fact-content"));
      this.#isProcessingResult = false;
    }
  }

  #updateConfidenceOnly(result) {
    const fill = document.querySelector("#confidence-fill");
    const label = document.querySelector("#detected-confidence");
    const resultCard = document.querySelector("#state-result");

    fill.style.width = `${result.confidence}%`;
    setElementText(label, `${result.confidence}%`);

    resultCard.className = `result-card result-main ${getConfidenceCardClass(result.confidence)}`;
  }

  #showState(stateName) {
    const states = {
      idle: document.querySelector("#state-idle"),
      loading: document.querySelector("#state-loading"),
      result: document.querySelector("#state-result"),
    };

    Object.entries(states).forEach(([name, element]) => {
      if (name === stateName) {
        showElement(element);
      } else {
        hideElement(element);
      }
    });
  }

  async #handleCopy() {
    const text = document.querySelector("#fun-fact-text").textContent;
    try {
      await navigator.clipboard.writeText(text);
      const btnCopy = document.querySelector("#btn-copy");
      btnCopy.classList.add("copied");
      setTimeout(() => btnCopy.classList.remove("copied"), 1500);
    } catch (error) {
      console.error("Gagal menyalin teks", error);
    }
  }
}
