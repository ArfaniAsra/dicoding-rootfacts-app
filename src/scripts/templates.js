export function generateCameraSection() {
  return `
    <section class="camera-section">
      <div class="camera-container">
        <div class="camera-wrapper">
          <video id="media-video" autoplay muted playsinline></video>
          <canvas id="media-canvas" class="hidden"></canvas>
          <div id="camera-overlay" class="camera-overlay">
            <div class="overlay-frame"></div>
          </div>
          <div id="camera-placeholder" class="camera-placeholder">
            <i data-lucide="camera" width="48" height="48"></i>
            <p>Kamera tidak aktif</p>
          </div>
        </div>

        <div class="camera-controls">
          <button id="btn-toggle" class="capture-btn">
            <i data-lucide="scan-line" width="24" height="24"></i>
          </button>
        </div>

        <div class="settings-bar">
          <div class="setting-item">
            <i data-lucide="camera" width="16" height="16"></i>
            <select id="camera-select">
              <option value="default">Belakang</option>
              <option value="front">Depan</option>
            </select>
          </div>
          <div class="setting-item fps-setting">
            <span id="fps-label">30 FPS</span>
            <input type="range" id="fps-slider" min="15" max="60" step="15" value="30">
          </div>
          <div class="setting-item tone-setting">
            <i data-lucide="mic" width="16" height="16"></i>
            <select id="tone-select">
              <option value="normal" selected>Normal</option>
              <option value="funny">Lucu</option>
              <option value="professional">Profesional</option>
              <option value="casual">Santai</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function generateInfoPanel() {
  return `
    <section class="results-section">
      ${generateIdleState()}
      ${generateLoadingState()}
      ${generateResultState()}
    </section>
  `;
}

function generateIdleState() {
  return `
    <div id="state-idle" class="result-card idle-card">
      <div class="idle-icon">
        <i data-lucide="sparkles" width="40" height="40"></i>
      </div>
      <h2>Scan Sayuran</h2>
      <p>Ketuk tombol di bawah untuk memulai dan temukan fakta menarik tentang sayuran!</p>
    </div>
  `;
}

function generateLoadingState() {
  return `
    <div id="state-loading" class="result-card loading-card hidden">
      <div class="loading-animation">
        <div class="loading-ring"></div>
        <div class="loading-icon">
          <i data-lucide="search" width="24" height="24"></i>
        </div>
      </div>
      <h2>Mencari...</h2>
      <p>Sedang mengidentifikasi sayuran Anda</p>
    </div>
  `;
}

function generateResultState() {
  return `
    <div id="state-result" class="result-card result-main hidden">
      <div class="detected-badge">
        <i data-lucide="check-circle" width="14" height="14"></i>
        <span id="detected-name">Sayuran</span>
      </div>

      <div class="fun-fact-card">
        <div class="fun-fact-icon">
          <i data-lucide="lightbulb" width="28" height="28"></i>
        </div>
        <div id="fun-fact-loading" class="fun-fact-loading hidden">
          <div class="fun-fact-loading-spinner"></div>
          <span>Memuat fakta menarik...</span>
        </div>
        <div id="fun-fact-content">
          <p id="fun-fact-text" class="fun-fact-text">Fakta menarik akan muncul di sini...</p>
          <button id="btn-copy" class="copy-btn" title="Salin fakta">
            <i data-lucide="copy" width="18" height="18"></i>
          </button>
        </div>
      </div>

      <div class="confidence-bar">
        <span class="confidence-label">Kepercayaan</span>
        <div class="confidence-track">
          <div id="confidence-fill" class="confidence-fill" style="width: 0%"></div>
        </div>
        <span id="detected-confidence" class="confidence-value">0%</span>
      </div>

      <div class="share-hint">
        <i data-lucide="share-2" width="14" height="14"></i>
        <span>Salin dan bagikan ke teman!</span>
      </div>
    </div>
  `;
}

export function generateFooter() {
  return `
    <footer class="footer">
      <p>Powered by TensorFlow.js & Transformers.js</p>
    </footer>
  `;
}
