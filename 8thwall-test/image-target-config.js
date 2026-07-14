(function () {
  const targetNames = ['1', '2', '3', '4', '5'];
  let scanStatus;
  let loadingOverlay;
  let appStarted = false;

  function ensureUi() {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'lag-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="lag-loading-card">
          <img src="./assets/lag-logo.jpg" alt="LAG" />
          <div class="lag-loading-text">Loading AR...</div>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
    }

    if (!scanStatus) {
      scanStatus = document.createElement('div');
      scanStatus.id = 'target-scan-status';
      scanStatus.textContent = 'Scan target 1-5';
      document.body.appendChild(scanStatus);
    }
  }

  function installStyles() {
    if (document.getElementById('christmas-target-config-style')) return;
    const style = document.createElement('style');
    style.id = 'christmas-target-config-style';
    style.textContent = `
      #lag-loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        background: #fff;
        color: #183a8f;
        font-family: Arial, Helvetica, sans-serif;
      }

      #lag-loading-overlay.hidden {
        display: none;
      }

      .lag-loading-card {
        display: grid;
        justify-items: center;
        gap: 18px;
      }

      .lag-loading-card img {
        width: min(46vw, 220px);
        height: auto;
        display: block;
      }

      .lag-loading-text {
        color: #183a8f;
        font-size: 18px;
        font-weight: 700;
      }

      #target-scan-status {
        position: fixed;
        left: 50%;
        bottom: calc(28px + env(safe-area-inset-bottom, 0px));
        z-index: 2147483646;
        transform: translateX(-50%);
        min-width: 190px;
        padding: 10px 16px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.68);
        color: #fff;
        font: 700 16px/1.2 Arial, Helvetica, sans-serif;
        text-align: center;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function hideLoadingOverlay() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }

  function setScanStatus(text) {
    ensureUi();
    scanStatus.textContent = text;
  }

  function startApp() {
    if (appStarted) return;
    appStarted = true;
    const script = document.createElement('script');
    script.src = './bundle.js';
    script.onerror = () => setScanStatus('Failed to load app bundle');
    document.body.appendChild(script);
  }

  function errorText(error) {
    if (!error) return 'Unknown error';
    if (error.stack) return error.stack.split('\n').slice(0, 2).join(' ');
    if (error.message) return error.message;
    return String(error);
  }

  async function loadImageTargets() {
    const targets = await Promise.all(
      targetNames.map(async (name) => {
        const response = await fetch(`./image-targets/${name}.json`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load image target ${name}: ${response.status}`);
        }
        return response.json();
      }),
    );
    return targets;
  }

  async function configureImageTargets() {
    try {
      installStyles();
      ensureUi();
      const imageTargetData = await loadImageTargets();
      if (!window.XR8 || !window.XR8.XrController) {
        window.addEventListener('xrloaded', configureImageTargets, { once: true });
        return;
      }

      const config = {
        disableWorldTracking: true,
        imageTargetData,
        imageTargets: imageTargetData,
      };
      window.__christmasImageTargetData = imageTargetData;
      window.XR8.XrController.configure(config);

      window.XR8.addCameraPipelineModule({
        name: 'christmas-image-target-debug',
        onStart: () => {
          hideLoadingOverlay();
          setScanStatus('Scan target 1-5');
        },
        listeners: [
          {
            event: 'reality.imagefound',
            process: ({ detail }) => {
              console.log('[Christmas AR] image found:', detail && detail.name);
              setScanStatus(`Target found: ${detail && detail.name ? detail.name : 'unknown'}`);
            },
          },
          {
            event: 'reality.imageupdated',
            process: ({ detail }) => {
              if (detail && detail.name) setScanStatus(`Tracking: ${detail.name}`);
            },
          },
          {
            event: 'reality.imagelost',
            process: ({ detail }) => {
              console.log('[Christmas AR] image lost:', detail && detail.name);
              setScanStatus('Scan target 1-5');
            },
          },
        ],
      });

      startApp();
    } catch (error) {
      console.error('[Christmas AR] image target configuration failed:', error);
      setScanStatus(`Image target setup failed: ${errorText(error)}`);
      setTimeout(hideLoadingOverlay, 1200);
    }
  }

  installStyles();
  ensureUi();
  setTimeout(hideLoadingOverlay, 9000);

  if (window.XR8) {
    configureImageTargets();
  } else {
    window.addEventListener('xrloaded', configureImageTargets, { once: true });
  }
})();
