// Avatar test server: serves the test page and proxies one fal call.
// FAL_KEY is read from the environment and never sent to the browser.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fal } from "@fal-ai/client";

const PORT = Number(process.env.PORT) || 3000;
const ENDPOINT = "fal-ai/flux-pulid";
const MAX_BODY = 8 * 1024 * 1024; // 8 MB (the page resizes selfies to ~1024px first)

if (!process.env.FAL_KEY) {
  console.warn("[avatar-test] FAL_KEY is not set: /api/avatar will return 503.");
}
fal.config({ credentials: process.env.FAL_KEY });

const STYLES = {
  "digital-traveler":
    "3D animated character portrait, stylized Pixar-like cinematic render of the same person, " +
    "a confident digital traveler wearing a sleek modern travel jacket with subtle glowing cyan neon accents, " +
    "holding a glowing holographic digital passport, standing in a futuristic smart airport gate " +
    "with holographic displays and the Dubai skyline at dusk behind, navy and electric blue color palette, " +
    "soft rim lighting, shallow depth of field, friendly expression, high detail, upper body shot",
};
const NEGATIVE =
  "text, watermark, logo, extra fingers, deformed hands, distorted face, blurry, low quality, photo-realistic skin";

// Small per-IP limiter so a test link can't run up the bill.
const hits = new Map();
function allowed(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error("Image too large"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleAvatar(req, res) {
  if (!process.env.FAL_KEY) return send(res, 503, { error: "Server is not connected to fal yet (FAL_KEY missing)." });
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (!allowed(ip)) return send(res, 429, { error: "Too many tries. Please wait a few minutes." });

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, e.status || 400, { error: e.status ? e.message : "Invalid request." });
  }
  const { image, style = "digital-traveler", consent } = body || {};
  if (consent !== true) return send(res, 400, { error: "Consent is required." });
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
    return send(res, 400, { error: "Please send a JPEG, PNG or WebP image." });
  }
  const prompt = STYLES[style];
  if (!prompt) return send(res, 400, { error: "Unknown style." });

  // One submit per request; we never auto-resubmit because each submit is billable.
  let requestId;
  try {
    const result = await fal.subscribe(ENDPOINT, {
      input: {
        prompt,
        negative_prompt: NEGATIVE,
        reference_image_url: image,
        image_size: "portrait_4_3",
        num_inference_steps: 20,
        guidance_scale: 4,
        id_weight: 1,
        sync_mode: true, // return a data URI; not kept in fal request history
        enable_safety_checker: true,
      },
      onEnqueue: (id) => { requestId = id; },
    });
    requestId = result.requestId || requestId;
    const url = result.data?.images?.[0]?.url;
    if (!url) {
      console.error(`[avatar-test] ${requestId}: no image in result`);
      return send(res, 502, { error: "No image came back. Please try another photo.", requestId });
    }
    if (result.data?.has_nsfw_concepts?.[0]) {
      return send(res, 422, { error: "The image was blocked by the safety filter. Please try another photo.", requestId });
    }
    return send(res, 200, { image: url, requestId });
  } catch (e) {
    const status = e?.status || 500;
    const detail = e?.body?.detail;
    const msg = typeof detail === "string" ? detail : e?.message || "Unknown error";
    console.error(`[avatar-test] request ${requestId || "(not queued)"} failed: ${status} ${msg}`);
    if (status === 403 && /exhausted balance/i.test(msg)) {
      return send(res, 402, { error: "The fal account is out of credits. Top up at fal.ai/dashboard/billing.", requestId });
    }
    return send(res, 502, { error: "Generation failed. Please try again.", requestId });
  }
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://x").pathname;
  try {
    if (req.method === "POST" && path === "/api/avatar") return await handleAvatar(req, res);
    if (req.method === "GET" && path === "/healthz") return send(res, 200, { ok: true, falKey: Boolean(process.env.FAL_KEY) });
    if (req.method === "GET" && (path === "/" || path === "/index.html")) {
      const html = await readFile(new URL("./public/index.html", import.meta.url));
      return send(res, 200, html, "text/html; charset=utf-8");
    }
    return send(res, 404, { error: "Not found" });
  } catch (e) {
    console.error("[avatar-test] server error:", e?.message);
    if (!res.headersSent) send(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => console.log(`[avatar-test] listening on http://localhost:${PORT}`));
