// Card reading for the Android build: calls the Claude API directly with the user's own key.
import Anthropic from "@anthropic-ai/sdk";

const SCHEMA = {
  type: "object",
  properties: {
    hero: { type: "array", items: { type: "string" } },
    board: { type: "array", items: { type: "string" } },
    pot: { type: ["number", "null"] },
    toCall: { type: ["number", "null"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: "string" },
  },
  required: ["hero", "board", "pot", "toCall", "confidence", "notes"],
  additionalProperties: false,
};

async function blobToBase64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return btoa(s);
}

// Resolves to the parsed JSON object, or throws {code, message}.
async function readCards(apiKey, prompt, images, signal) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const content = [];
  for (const img of images) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: await blobToBase64(img) } });
  }
  content.push({ type: "text", text: prompt });
  let response;
  try {
    response = await client.beta.messages.create(
      {
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
        messages: [{ role: "user", content }],
      },
      { signal },
    );
  } catch (e) {
    if (e instanceof Anthropic.APIUserAbortError) throw { code: "cancelled" };
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw { code: "bad_key", message: e.message };
    if (e instanceof Anthropic.RateLimitError) throw { code: "rate_limited", message: e.message };
    if (e instanceof Anthropic.BadRequestError) throw { code: "bad_request", message: e.message };
    if (e instanceof Anthropic.APIConnectionError) throw { code: "offline", message: e.message };
    if (e instanceof Anthropic.APIError) throw { code: "upstream_error", message: e.message };
    throw { code: "upstream_error", message: String(e?.message || e) };
  }
  if (response.stop_reason === "refusal") throw { code: "refused" };
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  try {
    return JSON.parse(text);
  } catch {
    throw { code: "invalid_json", message: text.slice(0, 200) };
  }
}

window.ClaudeCardReader = { readCards };
