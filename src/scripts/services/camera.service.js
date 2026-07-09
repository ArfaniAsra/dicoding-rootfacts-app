class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
    this.devices = [];
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
  }

  async loadCameras(cameraSelect) {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      this.devices = allDevices.filter((d) => d.kind === "videoinput");

      if (this.devices.length > 1 && cameraSelect) {
        cameraSelect.innerHTML = this.devices.map((device, index) => `<option value="${device.deviceId}">${device.label || `Kamera ${index + 1}`}</option>`).join("");
      }
    } catch (error) {
      this.devices = [];
    }
  }

  #getConstraintsFor(selectedValue) {
    const knownDevice = this.devices.find((d) => d.deviceId === selectedValue);
    if (knownDevice) {
      return { video: { deviceId: { exact: knownDevice.deviceId } } };
    }
    const facingMode = selectedValue === "front" ? "user" : "environment";
    return { video: { facingMode } };
  }

  async startCamera(videoId, canvasId, cameraSelect) {
    this.initializeElements(videoId, canvasId);
    await this.loadCameras(cameraSelect);

    const selectedValue = cameraSelect ? cameraSelect.value : "default";
    const constraints = this.#getConstraintsFor(selectedValue);

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;

    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        resolve();
      };
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    if (!this.stream) return;
    const [videoTrack] = this.stream.getVideoTracks();
    if (videoTrack) {
      videoTrack.applyConstraints({ frameRate: fps }).catch(() => {
      });
    }
  }

  isActive() {
    return !!(this.stream && this.stream.active);
  }
}

export default CameraService;
