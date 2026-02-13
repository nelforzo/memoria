/**
 * Collections Store
 *
 * Manages collection state and provides reactive updates.
 * Syncs with IndexedDB database via Dexie.js.
 */

import { db, Collection } from '../database/db.js';

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
 * Collections store - holds array of all collections
 */
function createCollectionsStore() {
  const store = createStore([]);

  return {
    subscribe: store.subscribe,
    get: store.get,

    /**
     * Load all collections from database
     */
    async load() {
      try {
        const collections = await db.collections
          .orderBy('updatedAt')
          .reverse()
          .toArray();

        store.set(collections);
        console.log('📚 Loaded', collections.length, 'collections');
        return collections;
      } catch (error) {
        console.error('Failed to load collections:', error);
        store.set([]);
        throw error;
      }
    },

    /**
     * Create a new collection
     * @param {Object} data - Collection data (name, description)
     * @returns {Promise<Collection>} Created collection
     */
    async create(data) {
      try {
        const collection = new Collection({
          name: data.name,
          description: data.description || ''
        });

        await db.collections.add(collection);

        // Add to store
        store.update(collections => [collection, ...collections]);

        console.log('✅ Created collection:', collection.name);
        return collection;
      } catch (error) {
        console.error('Failed to create collection:', error);
        throw error;
      }
    },

    /**
     * Update an existing collection
     * @param {string} id - Collection ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async update(id, updates) {
      try {
        const updatedData = {
          ...updates,
          updatedAt: Date.now()
        };

        await db.collections.update(id, updatedData);

        // Update in store
        store.update(collections =>
          collections.map(col =>
            col.id === id
              ? { ...col, ...updatedData }
              : col
          )
        );

        console.log('✅ Updated collection:', id);
      } catch (error) {
        console.error('Failed to update collection:', error);
        throw error;
      }
    },

    /**
     * Delete a collection
     * @param {string} id - Collection ID
     * @returns {Promise<void>}
     */
    async delete(id) {
      try {
        // Delete from database
        await db.collections.delete(id);

        // Also delete all cards in this collection
        await db.cards.where('collectionId').equals(id).delete();

        // Remove from store
        store.update(collections =>
          collections.filter(col => col.id !== id)
        );

        console.log('🗑️ Deleted collection:', id);
      } catch (error) {
        console.error('Failed to delete collection:', error);
        throw error;
      }
    },

    /**
     * Get a single collection by ID
     * @param {string} id - Collection ID
     * @returns {Promise<Collection>}
     */
    async getById(id) {
      try {
        const collection = await db.collections.get(id);
        return collection;
      } catch (error) {
        console.error('Failed to get collection:', error);
        throw error;
      }
    },

    /**
     * Update card count for a collection
     * @param {string} id - Collection ID
     * @param {number} count - New card count
     */
    async updateCardCount(id, count) {
      try {
        await db.collections.update(id, {
          cardCount: count,
          updatedAt: Date.now()
        });

        // Update in store
        store.update(collections =>
          collections.map(col =>
            col.id === id
              ? { ...col, cardCount: count, updatedAt: Date.now() }
              : col
          )
        );
      } catch (error) {
        console.error('Failed to update card count:', error);
        throw error;
      }
    },

    /**
     * Clear all collections (for testing)
     */
    async clear() {
      await db.collections.clear();
      await db.cards.clear();
      store.set([]);
      console.log('🗑️ Cleared all collections');
    }
  };
}

export const collections = createCollectionsStore();
