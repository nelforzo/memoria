/**
 * Memoria Database Configuration
 *
 * This file sets up the IndexedDB database using Dexie.js.
 * It defines the schema for collections and cards tables.
 */

import Dexie from 'dexie';

/**
 * Memoria Database Instance
 */
export const db = new Dexie('MemoriaDB');

/**
 * Database Schema v1
 *
 * Collections Table:
 * - id: Primary key (UUID)
 * - name: Collection name
 * - description: Optional description
 * - createdAt: Creation timestamp
 * - updatedAt: Last modification timestamp
 * - cardCount: Number of cards in collection
 *
 * Cards Table:
 * - id: Primary key (UUID)
 * - collectionId: Foreign key to collections
 * - text: Card text content
 * - imageBlob: Compressed image data (Blob)
 * - audioBlob: Compressed audio data (Blob)
 * - createdAt: Creation timestamp
 * - lastReviewedAt: Last study session timestamp
 * - reviewCount: Number of times reviewed
 * - difficulty: Optional difficulty rating for spaced repetition (0-5)
 */
db.version(1).stores({
  collections: 'id, name, createdAt, updatedAt',
  cards: 'id, collectionId, createdAt, lastReviewedAt'
});

/**
 * Collection Model
 */
export class Collection {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    this.cardCount = data.cardCount || 0;
  }
}

/**
 * Card Model
 */
export class Card {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.collectionId = data.collectionId || '';
    this.text = data.text || '';
    this.imageBlob = data.imageBlob || null;
    this.audioBlob = data.audioBlob || null;
    this.createdAt = data.createdAt || Date.now();
    this.lastReviewedAt = data.lastReviewedAt || null;
    this.reviewCount = data.reviewCount || 0;
    this.difficulty = data.difficulty || 0;
  }
}

/**
 * Database Helper Functions
 */

/**
 * Initialize the database and verify it's working
 * @returns {Promise<boolean>} True if database is ready
 */
export async function initDatabase() {
  try {
    // Open the database
    await db.open();
    console.log('✅ Memoria database initialized successfully');
    console.log('📊 Database version:', db.verno);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);

    // Check if browser supports IndexedDB
    if (!window.indexedDB) {
      console.error('⚠️ Your browser does not support IndexedDB. Please upgrade to a modern browser.');
    }

    return false;
  }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} Database stats
 */
export async function getDatabaseStats() {
  try {
    const collectionsCount = await db.collections.count();
    const cardsCount = await db.cards.count();

    return {
      collections: collectionsCount,
      cards: cardsCount,
      version: db.verno
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return {
      collections: 0,
      cards: 0,
      version: db.verno
    };
  }
}

/**
 * Clear all data from the database (for development/testing)
 * ⚠️ WARNING: This will delete all collections and cards!
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  try {
    await db.collections.clear();
    await db.cards.clear();
    console.log('🗑️ Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Export database for debugging
 * @returns {Promise<Object>} All database data
 */
export async function exportDatabaseForDebug() {
  try {
    const collections = await db.collections.toArray();
    const cards = await db.cards.toArray();

    return {
      collections,
      cards,
      stats: await getDatabaseStats()
    };
  } catch (error) {
    console.error('Failed to export database:', error);
    return null;
  }
}

// Make database available globally for console debugging in development
if (import.meta.env.DEV) {
  window.memoriaDB = {
    db,
    Collection,
    Card,
    initDatabase,
    getDatabaseStats,
    clearDatabase,
    exportDatabaseForDebug
  };
  console.log('🔧 Development mode: Database utilities available at window.memoriaDB');
}

export default db;
