'use strict';
/**
 * Ollama client (Session 57) — local LLM for the "Ask a Question" AI answer.
 * Talks to a local Ollama daemon's /api/generate. Model + host are env-configurable:
 *   OLLAMA_URL         (default http://127.0.0.1:11434)
 *   OLLAMA_MODEL       (default qwen3:4b)
 *   OLLAMA_TIMEOUT_MS  (default 45000)
 * Node 18+ global fetch is used. All failures are swallowed (returns { ok:false })
 * so the rule-based Kundli answer always still works if the LLM is down.
 */

const OLLAMA_URL      = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL || 'qwen3:4b';
const OLLAMA_TIMEOUT  = Number(process.env.OLLAMA_TIMEOUT_MS) || 60000;
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || '10m';

// Qwen3 is a "thinking" model; strip any reasoning block it may still emit.
function stripThinking(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();
}

/**
 * Generate a completion. Returns { ok:true, text, model } or { ok:false, error }.
 * @param {string} prompt
 * @param {object} [opts] { system, temperature, num_predict, model, timeoutMs }
 */
async function generate(prompt, opts = {}) {
  if (!prompt || typeof prompt !== 'string') return { ok:false, error:'empty prompt' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || OLLAMA_TIMEOUT);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      signal:controller.signal,
      body:JSON.stringify({
        model:  opts.model || OLLAMA_MODEL,
        prompt,
        system: opts.system || undefined,
        stream: false,
        think:  false,                       // disable Qwen3 chain-of-thought
        keep_alive: OLLAMA_KEEP_ALIVE,        // keep model resident between questions
        options:{
          temperature: opts.temperature ?? 0.6,
          top_p:       opts.top_p ?? 0.9,
          num_predict: opts.num_predict ?? 400,
        },
      }),
    });
    if (!res.ok) return { ok:false, error:`ollama ${res.status}` };
    const data = await res.json();
    const text = stripThinking(data?.response);
    if (!text) return { ok:false, error:'empty response' };
    return { ok:true, text, model:data?.model || opts.model || OLLAMA_MODEL };
  } catch (e) {
    return { ok:false, error:e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming generate. Calls onToken(textPiece) for each chunk as it arrives.
 * Returns { ok, chars } when the stream ends. Swallows failures.
 * @param {object} p { prompt, system, opts }
 * @param {(piece:string)=>void} onToken
 */
async function streamGenerate({ prompt, system, opts = {} }, onToken) {
  if (!prompt) return { ok:false, error:'empty prompt' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || OLLAMA_TIMEOUT);
  let chars = 0;
  let inThink = false;
  // Defensive incremental <think> filter (think:false usually prevents any).
  const filterEmit = (piece) => {
    let out = '';
    let rest = piece;
    while (rest) {
      if (inThink) {
        const close = rest.indexOf('</think>');
        if (close === -1) return out;              // still inside think block
        rest = rest.slice(close + 8); inThink = false;
      } else {
        const open = rest.indexOf('<think>');
        if (open === -1) { out += rest; rest = ''; }
        else { out += rest.slice(0, open); rest = rest.slice(open + 7); inThink = true; }
      }
    }
    return out;
  };
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      signal:controller.signal,
      body:JSON.stringify({
        model:  opts.model || OLLAMA_MODEL,
        prompt,
        system: system || undefined,
        stream: true,
        think:  false,
        keep_alive: OLLAMA_KEEP_ALIVE,
        options:{ temperature: opts.temperature ?? 0.6, top_p: opts.top_p ?? 0.9, num_predict: opts.num_predict ?? 420 },
      }),
    });
    if (!res.ok || !res.body) return { ok:false, error:`ollama ${res.status}` };
    const decoder = new TextDecoder();
    let buf = '';
    for await (const chunk of res.body) {
      buf += decoder.decode(chunk, { stream:true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let obj; try { obj = JSON.parse(line); } catch { continue; }
        const piece = obj.response ? filterEmit(obj.response) : '';
        if (piece) { chars += piece.length; onToken(piece); }
        if (obj.done) return { ok: chars > 0, chars };
      }
    }
    return { ok: chars > 0, chars };
  } catch (e) {
    return { ok:false, error: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally {
    clearTimeout(timer);
  }
}

// Lightweight health probe for admin/diagnostics.
async function health() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal:controller.signal });
    return { ok:res.ok, url:OLLAMA_URL, model:OLLAMA_MODEL };
  } catch (e) {
    return { ok:false, url:OLLAMA_URL, model:OLLAMA_MODEL, error:e.message };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { generate, streamGenerate, health, OLLAMA_MODEL, OLLAMA_URL };
