(function () {
  const targetNames = ['1', '2', '3', '4', '5'];

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
      const imageTargetData = await loadImageTargets();
      if (!window.XR8 || !window.XR8.XrController) {
        window.addEventListener('xrloaded', configureImageTargets, { once: true });
        return;
      }

      window.XR8.XrController.configure({
        disableWorldTracking: true,
        imageTargetData,
      });

      window.XR8.addCameraPipelineModule({
        name: 'christmas-image-target-debug',
        listeners: [
          {
            event: 'reality.imagefound',
            process: ({ detail }) => {
              console.log('[Christmas AR] image found:', detail && detail.name);
            },
          },
          {
            event: 'reality.imagelost',
            process: ({ detail }) => {
              console.log('[Christmas AR] image lost:', detail && detail.name);
            },
          },
        ],
      });
    } catch (error) {
      console.error('[Christmas AR] image target configuration failed:', error);
    }
  }

  if (window.XR8) {
    configureImageTargets();
  } else {
    window.addEventListener('xrloaded', configureImageTargets, { once: true });
  }
})();
