import worker from "../backend/src/index.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }

  const init = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", chunk => chunks.push(Buffer.from(chunk)));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
  }

  const request = new Request(`https://${req.headers.host || "localhost"}${req.url}`, init);
  try {
    const response = await worker.fetch(request, process.env);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("[v0] API request failed", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "اتصال سرویس احراز هویت برقرار نیست" }));
  }
  return;
}
