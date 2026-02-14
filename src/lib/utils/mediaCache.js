const CACHE_NAME = 'memoria-media-v1';

export async function saveMedia(cardId, type, blob) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(
    `media/card-${cardId}-${type}`,
    new Response(blob, { headers: { 'Content-Type': blob.type } })
  );
}

export async function getMedia(cardId, type) {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(`media/card-${cardId}-${type}`);
  return response ? response.blob() : null;
}

export async function deleteMedia(cardId, type) {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(`media/card-${cardId}-${type}`);
}

export async function deleteAllCardMedia(cardId) {
  await Promise.all([deleteMedia(cardId, 'image'), deleteMedia(cardId, 'audio')]);
}
