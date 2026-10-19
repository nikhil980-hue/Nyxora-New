import { useCallback, useRef, useState } from "react";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function useScreenUnderstanding() {
  const streamRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
    setCapturing(false);
  }, []);

  const capture = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen capture is not supported by this browser.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });
      streamRef.current = stream;
      setCapturing(true);

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      const width = Math.min(Number(settings.width) || 1600, 2200);
      const height = Math.min(Number(settings.height) || 1000, 1400);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(video, 0, 0, width, height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (!blob) throw new Error("Could not capture the screen frame.");
      const data = await blobToBase64(blob);
      return new File([blob], `nyxora-screen-${Date.now()}.jpg`, { type: "image/jpeg" });
    } catch (captureError) {
      setError(captureError?.message || "Screen capture failed.");
      return null;
    } finally {
      stop();
    }
  }, [stop]);

  const analyze = useCallback(async (file, prompt = "Describe what is visible on my screen and identify the relevant controls.") => {
    setError("");
    if (!file) return null;
    try {
      const data = await blobToBase64(file);
      const response = await fetch(`${API_BASE}/api/computer/screen/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: { data, mimeType: file.type || "image/jpeg" }, prompt }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Screen analysis failed.");
      return result.output || "";
    } catch (analysisError) {
      setError(analysisError?.message || "Screen analysis failed.");
      return null;
    }
  }, []);

  return { capture, analyze, stop, capturing, error };
}
