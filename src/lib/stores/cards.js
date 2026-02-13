/**
 * Cards Store
 *
 * Manages card state and provides reactive updates.
 * Syncs with IndexedDB database via Dexie.js.
 */

import { db, Card } from '../database/db.js';
import { collections } from './collections.js';

/**
 * Simple observable store (replaces Svelte writable)
 */
function createStore(initial) {
  let value = initial;
  const listeners = new Set();

  return {
    get()       { return value; },
    set(v)      { value = v; listeners.forEach(fn => fn(value)); },
    update(fn)  { value = fn(value); listeners.forEach(fn2 => fn2(value)); },
    subscribe(fn) {
      listeners.add(fn);
      fn(value); // immediate call with current value
      return () => listeners.delete(fn);
    }
  };
}

/**
 * Cards store - holds array of cards for current collection
 */
function createCardsStore() {
  const store = createStore([]);

  return {
    subscribe: store.subscribe,
    get: store.get,

    /**
     * Load all cards for a specific collection
     * @param {string} collectionId - Collection ID
     * @returns {Promise<Array>} Array of cards
     */
    async load(collectionId) {
      try {
        const cards = await db.cards
          .where('collectionId')
          .equals(collectionId)
          .sortBy('createdAt');

        // Reverse to show newest first
        cards.reverse();

        store.set(cards);
        console.log('📇 Loaded', cards.length, 'cards for collection', collectionId);
        return cards;
      } catch (error) {
        console.error('Failed to load cards:', error);
        store.set([]);
        throw error;
      }
    },

    /**
     * Create a new card
     * @param {string} collectionId - Collection ID
     * @param {Object} data - Card data (text, imageBlob, audioBlob)
     * @returns {Promise<Card>} Created card
     */
    async create(collectionId, data) {
      try {
        const card = new Card({
          collectionId,
          text: data.text,
          imageBlob: data.imageBlob || null,
          audioBlob: data.audioBlob || null
        });

        await db.cards.add(card);

        // Add to store (prepend to show newest first)
        store.update(cards => [card, ...cards]);

        // Update collection card count
        await updateCollectionCardCount(collectionId);

        console.log('✅ Created card:', card.id);
        return card;
      } catch (error) {
        console.error('Failed to create card:', error);
        throw error;
      }
    },

    /**
     * Update an existing card
     * @param {string} id - Card ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async update(id, updates) {
      try {
        await db.cards.update(id, updates);

        // Update in store
        store.update(cards =>
          cards.map(card =>
            card.id === id
              ? { ...card, ...updates }
              : card
          )
        );

        console.log('✅ Updated card:', id);
      } catch (error) {
        console.error('Failed to update card:', error);
        throw error;
      }
    },

    /**
     * Delete a card
     * @param {string} id - Card ID
     * @param {string} collectionId - Collection ID (for updating count)
     * @returns {Promise<void>}
     */
    async delete(id, collectionId) {
      try {
        await db.cards.delete(id);

        // Remove from store
        store.update(cards => cards.filter(card => card.id !== id));

        // Update collection card count
        await updateCollectionCardCount(collectionId);

        console.log('🗑️ Deleted card:', id);
      } catch (error) {
        console.error('Failed to delete card:', error);
        throw error;
      }
    },

    /**
     * Get a single card by ID
     * @param {string} id - Card ID
     * @returns {Promise<Card>}
     */
    async getById(id) {
      try {
        const card = await db.cards.get(id);
        return card;
      } catch (error) {
        console.error('Failed to get card:', error);
        throw error;
      }
    },

    /**
     * Update review stats for a card (for study mode)
     * @param {string} id - Card ID
     * @returns {Promise<void>}
     */
    async markAsReviewed(id) {
      try {
        const card = await db.cards.get(id);
        if (!card) return;

        await db.cards.update(id, {
          lastReviewedAt: Date.now(),
          reviewCount: (card.reviewCount || 0) + 1
        });

        // Update in store
        store.update(cards =>
          cards.map(c =>
            c.id === id
              ? {
                  ...c,
                  lastReviewedAt: Date.now(),
                  reviewCount: (c.reviewCount || 0) + 1
                }
              : c
          )
        );

        console.log('📝 Marked card as reviewed:', id);
      } catch (error) {
        console.error('Failed to mark card as reviewed:', error);
        throw error;
      }
    },

    /**
     * Clear all cards from store (doesn't affect database)
     */
    clear() {
      store.set([]);
    }
  };
}

/**
 * Helper function to update collection card count
 * @param {string} collectionId - Collection ID
 */
async function updateCollectionCardCount(collectionId) {
  try {
    const count = await db.cards
      .where('collectionId')
      .equals(collectionId)
      .count();

    await collections.updateCardCount(collectionId, count);
  } catch (error) {
    console.error('Failed to update collection card count:', error);
  }
}

export const cards = createCardsStore();
