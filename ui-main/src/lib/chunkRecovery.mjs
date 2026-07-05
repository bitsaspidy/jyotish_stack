export const CHUNK_RELOAD_STORAGE_KEY = 'jyotish-chunk-reload-at';
export const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

export function isChunkLoadFailure(errorLike) {
  const value = errorLike?.reason || errorLike?.error || errorLike;
  const message = value?.message || String(value || '');
  return /ChunkLoadError|Loading chunk .+ failed|Failed to fetch dynamically imported module/i.test(message);
}

export function shouldAttemptChunkReload(lastAttempt, now = Date.now()) {
  const previous = Number(lastAttempt || 0);
  return !Number.isFinite(previous) || previous <= 0 || now - previous >= CHUNK_RELOAD_COOLDOWN_MS;
}
