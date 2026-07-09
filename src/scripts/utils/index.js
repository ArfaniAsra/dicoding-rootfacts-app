import {
  APP_CONFIG,
  UI_CONFIG,
} from "../config.js";

export const isMobileDevice = () => {
  return (
    navigator.userAgentData?.mobile ??
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
};

export const createDelay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sleep = (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export const isValidDetection = (result) => {
  const { detectionConfidenceThreshold } = APP_CONFIG;
  return (
    result &&
    result.isValid &&
    result.confidence >= detectionConfidenceThreshold
  );
};

export const validateModelMetadata = (metadata) => {
  return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getConfidenceTheme = (confidence) => {
  const { excellent, good } = UI_CONFIG.confidenceThresholds;
  if (confidence >= excellent) return "green";
  if (confidence >= good) return "yellow";
  return "red";
};

export const getConfidenceTextClass = (confidence) => {
  const theme = getConfidenceTheme(confidence);
  return `text-${theme}`;
};

export const getConfidenceCardClass = (confidence) => {
  const theme = getConfidenceTheme(confidence);
  return `theme-${theme}`;
};

export const getCameraErrorMessage = (error) => {
  if (error.name === "NotAllowedError") {
    return "Izin kamera ditolak. Harap izinkan akses kamera.";
  } else if (error.name === "NotFoundError") {
    return "Tidak ada kamera ditemukan pada perangkat ini.";
  } else if (error.name === "NotReadableError") {
    return "Kamera sedang digunakan oleh aplikasi lain.";
  }
  return "Gagal memulai kamera";
};

export const addFadeInAnimation = (element) => {
  if (!element) return;

  const { fadeAnimation } = UI_CONFIG;
  element.style.animation = "none";
  void element.offsetWidth;
  element.style.animation = fadeAnimation;
};

export const addScaleAnimation = (element, callback) => {
  if (!element) return;

  const { animationDuration } = UI_CONFIG;
  element.style.transform = "scale(1.02)";
  element.style.transition = `transform ${animationDuration}ms ease`;

  setTimeout(() => {
    if (element) {
      element.style.transform = "scale(1)";
    }
    if (callback) {
      callback();
    }
  }, animationDuration);
};

export const hideElement = (element) => {
  if (element) element.classList.add("hidden");
};

export const showElement = (element) => {
  if (element) element.classList.remove("hidden");
};

export const setElementOpacity = (element, opacity) => {
  if (element) element.style.opacity = opacity;
};

export const setElementText = (element, text) => {
  if (element) element.textContent = text;
};

export const setElementHTML = (element, html) => {
  if (element) element.innerHTML = html;
};

export const logError = (context, error) => {
  console.error(`❌ ${context}:`, error);
};

export const isWebGPUSupported = () => {
  return typeof navigator !== "undefined" && "gpu" in navigator;
};
