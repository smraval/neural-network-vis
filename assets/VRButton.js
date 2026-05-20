/**
 * Minimal self-hosted replacement for Three.js examples `VRButton.js`
 * compatible with THREE r128 when included via a normal <script> tag.
 *
 * Exposes a global `VRButton` with `createButton( renderer )`.
 *
 * Notes:
 * - This intentionally implements only the common "Enter VR / Exit VR" flow.
 * - It avoids external CDN dependencies so it works offline / behind firewalls.
 */
(function () {
  "use strict";

  function stylizeButton(button) {
    // Similar to Three's example styling but slightly simplified.
    button.style.position = "absolute";
    button.style.bottom = "20px";
    button.style.padding = "12px 16px";
    button.style.border = "1px solid rgba(91, 160, 255, 0.35)";
    button.style.borderRadius = "14px";
    button.style.background = "rgba(10, 16, 30, 0.88)";
    button.style.color = "rgba(225, 235, 255, 0.92)";
    button.style.font = "600 12px/1 Inter, system-ui, -apple-system, Segoe UI, sans-serif";
    button.style.letterSpacing = "0.06em";
    button.style.textTransform = "uppercase";
    button.style.cursor = "pointer";
    button.style.outline = "none";
    button.style.backdropFilter = "blur(18px)";
    button.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.35)";
    button.style.userSelect = "none";
  }

  function createButton(renderer, sessionInit) {
    if (!renderer) {
      throw new Error("VRButton.createButton(renderer) requires a renderer.");
    }
    if (!renderer.xr) {
      throw new Error("VRButton requires a THREE.WebGLRenderer with .xr support.");
    }

    var button = document.createElement("button");
    button.id = "VRButton";
    stylizeButton(button);

    var currentSession = null;

    function showEnterVR() {
      button.style.display = "";
      button.disabled = false;
      button.textContent = "Enter VR";
    }

    function showExitVR() {
      button.style.display = "";
      button.disabled = false;
      button.textContent = "Exit VR";
    }

    function showWebXRNotFound() {
      button.style.display = "";
      button.disabled = true;
      button.style.cursor = "not-allowed";
      button.textContent = "VR not supported";
    }

    async function onSessionEnded() {
      currentSession = null;
      showEnterVR();
    }

    async function onButtonClick() {
      if (currentSession) {
        try {
          await currentSession.end();
        } catch (_e) {
          // ignore
        }
        return;
      }

      try {
        var init = sessionInit || { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"] };
        var session = await navigator.xr.requestSession("immersive-vr", init);
        session.addEventListener("end", onSessionEnded);
        await renderer.xr.setSession(session);
        currentSession = session;
        showExitVR();
      } catch (e) {
        // Keep the button visible; users can try again after granting permissions etc.
        // eslint-disable-next-line no-console
        console.warn("[WebXR] Failed to start immersive-vr session:", e);
      }
    }

    button.addEventListener("click", onButtonClick);

    if (typeof navigator === "undefined" || !navigator.xr) {
      showWebXRNotFound();
      return button;
    }

    // If supported, show the button; if not, show disabled.
    navigator.xr
      .isSessionSupported("immersive-vr")
      .then(function (supported) {
        if (supported) showEnterVR();
        else showWebXRNotFound();
      })
      .catch(function () {
        showWebXRNotFound();
      });

    return button;
  }

  // Expose global like Three's example.
  window.VRButton = { createButton: createButton };
})();

