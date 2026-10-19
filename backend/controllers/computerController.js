import {
  moveMouse,
  clickMouse,
  typeText,
  pressKey,
  hotkey,
  getPointerPosition,
  getDesktopEnvironment,
} from "../services/computerControlService.js";
import { analyzeScreenImage } from "../services/screenUnderstandingService.js";
import { openApplication } from "../services/applicationControlService.js";
import { getSystemStatus, openUrl, powerAction } from "../services/osControlService.js";
import { observeDesktop, verifyAction } from "../services/observationVerificationService.js";

function user(req) {
  return req.nyxoraUser?.uid || null;
}

function blocked(req) {
  if (!user(req)) {
    return {
      status: 401,
      body: { success: false, error: "Authenticated Firebase user required for computer control." },
    };
  }

  if (String(process.env.NYXORA_COMPUTER_CONTROL_ENABLED || "false").toLowerCase() !== "true") {
    return {
      status: 403,
      body: {
        success: false,
        error: "Computer control is disabled. Set NYXORA_COMPUTER_CONTROL_ENABLED=true on the local Nyxora machine.",
      },
    };
  }

  return null;
}

export async function pointer(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await getPointerPosition()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function move(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await moveMouse(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function click(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await clickMouse(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function type(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await typeText(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function key(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await pressKey(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function hotkeys(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await hotkey(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function environment(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await getDesktopEnvironment()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function screenObserve(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await observeDesktop()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function screenAnalyze(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await analyzeScreenImage(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function verify(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await verifyAction(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function openApp(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await openApplication(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function osStatus(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await getSystemStatus()); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function osOpenUrl(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await openUrl(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
export async function osPower(req, res) { const b = blocked(req); if (b) return res.status(b.status).json(b.body); try { return res.json(await powerAction(req.body)); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } }
