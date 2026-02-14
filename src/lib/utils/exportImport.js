/**
 * Export/Import Utilities
 *
 * Functions for exporting and importing collections with media
 */

import { db } from '../database/db.js';
import { saveMedia, deleteMedia, getMedia } from './mediaCache.js';

const EXPORT_VERSION = '1.0';

/**
 * Convert Blob to base64 data URI
 * @param {Blob} blob - Blob to convert
 * @returns {Promise<Object>} Object with type and data
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve({
        type: blob.type,
        data: reader.result
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 data URI back to Blob
 * @param {Object} dataObj - Object with type and data
 * @returns {Blob}
 */
function base64ToBlob(dataObj) {
  if (!dataObj || !dataObj.data) return null;

  try {
    const { type, data } = dataObj;
    const byteString = atob(data.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type });
  } catch (error) {
    console.error('Failed to convert base64 to blob:', error);
    return null;
  }
}

/**
 * Export a single collection
 * @param {string} collectionId - Collection ID to export
 * @returns {Promise<void>}
 */
export async function exportCollection(collectionId) {
  try {
    // Get collection
    const collection = await db.collections.get(collectionId);

    if (!collection) {
      throw new Error('Collection not found');
    }

    // Get all cards for this collection
    const cards = await db.cards
      .where('collectionId')
      .equals(collectionId)
      .toArray();

    console.log(`📦 Exporting collection "${collection.name}" with ${cards.length} cards...`);

    // Convert media to base64
    const cardsWithBase64 = await Promise.all(
      cards.map(async (card) => {
        const imageBlob = card.hasImage ? await getMedia(card.id, 'image') : null;
        const audioBlob = card.hasAudio ? await getMedia(card.id, 'audio') : null;
        return {
          ...card,
          imageBlob: imageBlob ? await blobToBase64(imageBlob) : null,
          audioBlob: audioBlob ? await blobToBase64(audioBlob) : null
        };
      })
    );

    // Create export data
    const exportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      collections: [{
        ...collection,
        cards: cardsWithBase64
      }]
    };

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${collection.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.json`;

    // Download file
    downloadJSON(exportData, filename);

    console.log('✅ Export completed');
  } catch (error) {
    console.error('Failed to export collection:', error);
    throw error;
  }
}

/**
 * Export all collections
 * @returns {Promise<void>}
 */
export async function exportAllCollections() {
  try {
    // Get all collections
    const collections = await db.collections.toArray();

    if (collections.length === 0) {
      throw new Error('No collections to export');
    }

    console.log(`📦 Exporting all ${collections.length} collections...`);

    // Get cards for each collection and convert blobs
    const collectionsWithCards = await Promise.all(
      collections.map(async (collection) => {
        const cards = await db.cards
          .where('collectionId')
          .equals(collection.id)
          .toArray();

        const cardsWithBase64 = await Promise.all(
          cards.map(async (card) => {
            const imageBlob = card.hasImage ? await getMedia(card.id, 'image') : null;
            const audioBlob = card.hasAudio ? await getMedia(card.id, 'audio') : null;
            return {
              ...card,
              imageBlob: imageBlob ? await blobToBase64(imageBlob) : null,
              audioBlob: audioBlob ? await blobToBase64(audioBlob) : null
            };
          })
        );

        return {
          ...collection,
          cards: cardsWithBase64
        };
      })
    );

    // Create export data
    const exportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      collections: collectionsWithCards
    };

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `memoria_backup_${timestamp}.json`;

    // Download file
    downloadJSON(exportData, filename);

    console.log('✅ Export completed');
  } catch (error) {
    console.error('Failed to export all collections:', error);
    throw error;
  }
}

/**
 * Import collections from JSON file
 * @param {File} file - JSON file to import
 * @param {string} strategy - Import strategy: 'merge' or 'replace'
 * @returns {Promise<Object>} Import result with statistics
 */
export async function importCollections(file, strategy = 'merge') {
  try {
    // Read file
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.version || !data.collections || !Array.isArray(data.collections)) {
      throw new Error('Invalid export file format');
    }

    if (data.version !== EXPORT_VERSION) {
      console.warn(`Export version mismatch: ${data.version} vs ${EXPORT_VERSION}`);
    }

    console.log(`📥 Importing ${data.collections.length} collection(s) with strategy: ${strategy}`);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const collection of data.collections) {
      const { cards, ...collectionData } = collection;

      // Check if collection exists
      const existing = await db.collections.get(collection.id);

      if (existing) {
        if (strategy === 'merge') {
          // Skip existing collection
          skipped++;
          console.log(`⏭️ Skipped existing collection: ${collection.name}`);
          continue;
        } else if (strategy === 'replace') {
          // Delete existing cards and their media
          const existingCards = await db.cards.where('collectionId').equals(collection.id).toArray();
          for (const c of existingCards) {
            await deleteMedia(c.id, 'image');
            await deleteMedia(c.id, 'audio');
          }
          await db.cards.where('collectionId').equals(collection.id).delete();
          updated++;
          console.log(`🔄 Replaced collection: ${collection.name}`);
        }
      } else {
        imported++;
      }

      // Insert/update collection
      await db.collections.put(collectionData);

      // Insert cards (metadata only) and save media to cache
      if (cards && Array.isArray(cards)) {
        for (const card of cards) {
          const imageBlob = card.imageBlob ? base64ToBlob(card.imageBlob) : null;
          const audioBlob = card.audioBlob ? base64ToBlob(card.audioBlob) : null;

          const cardData = {
            ...card,
            hasImage: imageBlob !== null,
            hasAudio: audioBlob !== null,
            imageMimeType: imageBlob?.type || null,
            audioMimeType: audioBlob?.type || null
          };
          delete cardData.imageBlob;
          delete cardData.audioBlob;

          await db.cards.put(cardData);

          if (imageBlob) await saveMedia(card.id, 'image', imageBlob);
          if (audioBlob) await saveMedia(card.id, 'audio', audioBlob);
        }
      }
    }

    const result = {
      imported,
      skipped,
      updated,
      total: data.collections.length
    };

    console.log('✅ Import completed:', result);

    return result;
  } catch (error) {
    console.error('Failed to import collections:', error);
    throw error;
  }
}

/**
 * Download JSON data as file
 * @param {Object} data - Data to download
 * @param {string} filename - Filename
 */
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate import file before importing
 * @param {File} file - File to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateImportFile(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.version) {
      return { valid: false, error: 'Missing version field' };
    }

    if (!data.collections || !Array.isArray(data.collections)) {
      return { valid: false, error: 'Missing or invalid collections field' };
    }

    if (data.collections.length === 0) {
      return { valid: false, error: 'No collections in file' };
    }

    return {
      valid: true,
      version: data.version,
      collectionsCount: data.collections.length,
      exportDate: data.exportDate
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Invalid JSON file'
    };
  }
}
