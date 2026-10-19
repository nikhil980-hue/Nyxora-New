import {
  listFiles,
  readFile,
  writeFile,
  createDirectory,
  deletePath,
  getControlRoot,
} from "../services/fileSystemControlService.js";

function auth(req) {
  return req.nyxoraUser?.uid || null;
}

function gate(req, res) {
  if (!auth(req)) {
    return res.status(401).json({
      success: false,
      error: "Authenticated Firebase user required for filesystem control.",
    });
  }

  if (String(process.env.NYXORA_FILESYSTEM_CONTROL_ENABLED || "false").toLowerCase() !== "true") {
    return res.status(403).json({
      success: false,
      error: "Filesystem control is disabled. Set NYXORA_FILESYSTEM_CONTROL_ENABLED=true.",
    });
  }

  return null;
}

export async function root(req, res) { const g = gate(req, res); if (g) return g; return res.json({ success: true, root: getControlRoot() }); }
export async function list(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await listFiles(req.query)); } catch (e) { return res.status(400).json({ success: false, error: e.message }); } }
export async function read(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await readFile(req.body)); } catch (e) { return res.status(400).json({ success: false, error: e.message }); } }
export async function write(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await writeFile(req.body)); } catch (e) { return res.status(400).json({ success: false, error: e.message }); } }
export async function mkdir(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await createDirectory(req.body)); } catch (e) { return res.status(400).json({ success: false, error: e.message }); } }
export async function remove(req, res) { const g = gate(req, res); if (g) return g; try { return res.json(await deletePath(req.body)); } catch (e) { return res.status(400).json({ success: false, error: e.message }); } }
