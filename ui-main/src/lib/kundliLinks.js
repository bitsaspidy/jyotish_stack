export function predictionHref(uuid) {
  return uuid ? `/predictions?kundli=${encodeURIComponent(uuid)}` : '/predictions';
}

export function readPredictionKundliParam(search) {
  if (!search) return '';
  const params = new URLSearchParams(search);
  return (
    params.get('kundli') ||
    params.get('kundli_id') ||
    params.get('kundliId') ||
    params.get('uuid') ||
    ''
  );
}
