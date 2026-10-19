import {
  navigateBrowser,
  browserSnapshot,
  clickBrowser,
  typeBrowser,
  pressBrowser,
  screenshotBrowser,
  closeBrowser,
} from "../services/browserControlService.js";
import { analyzeScreenImage } from "../services/screenUnderstandingService.js";

function auth(req) {
  return req.nyxoraUser?.uid || null;
}

function gate(req, res) {
  if (!auth(req)) {
    return res.status(401).json({
      success: false,
      error: "Authenticated Firebase user required for browser control.",
    });
  }

  if (String(process.env.NYXORA_BROWSER_CONTROL_ENABLED || "false").toLowerCase() !== "true") {
    return res.status(403).json({
      success: false,
      error: "Browser control is disabled. Set NYXORA_BROWSER_CONTROL_ENABLED=true on the local Nyxora machine.",
    });
  }

  return null;
}

export async function navigate(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await navigateBrowser(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function snapshot(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await browserSnapshot()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function click(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await clickBrowser(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function type(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await typeBrowser(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function press(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await pressBrowser(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function screenshot(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await screenshotBrowser(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function analyze(req, res) {
  const g = gate(req, res);
  if (g) return g;
  try {
    const shot = await screenshotBrowser({ fullPage: false });
    if (!shot.success) return res.status(500).json(shot);
    return res.json(await analyzeScreenImage({
      image: { data: shot.data, mimeType: shot.mimeType },
      prompt: req.body?.prompt,
    }));
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
export async function close(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await closeBrowser()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
