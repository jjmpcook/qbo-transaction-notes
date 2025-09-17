import { promises as fs } from 'fs';
import { join } from 'path';
import { NotePayload } from './validate.js';

// Simple file-based storage for when database is unavailable
export class FileStorage {
  private static readonly STORAGE_DIR = '/tmp/qbo-notes';
  private static readonly DATA_FILE = 'transactions.jsonl'; // JSONL format (one JSON object per line)

  /**
   * Ensure storage directory exists
   */
  static async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.STORAGE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating storage directory:', error);
    }
  }

  /**
   * Append transaction data to file
   */
  static async storeTransaction(noteData: NotePayload): Promise<string> {
    try {
      await this.ensureStorageDir();

      const record = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...noteData,
        created_at: new Date().toISOString(),
        status: 'Open',
      };

      const filePath = join(this.STORAGE_DIR, this.DATA_FILE);
      const jsonLine = JSON.stringify(record) + '\n';

      await fs.appendFile(filePath, jsonLine, 'utf8');

      console.log(`✅ Transaction stored to file: ${record.id}`);
      return record.id;
    } catch (error) {
      console.error('❌ File storage failed:', error);
      throw error;
    }
  }

  /**
   * Read all transactions from file
   */
  static async getAllTransactions(): Promise<any[]> {
    try {
      await this.ensureStorageDir();

      const filePath = join(this.STORAGE_DIR, this.DATA_FILE);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        console.log('📝 No transaction file found, returning empty array');
        return [];
      }

      const data = await fs.readFile(filePath, 'utf8');
      const lines = data.trim().split('\n').filter(line => line.trim());

      const transactions = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          console.error('Error parsing transaction line:', parseError);
          return null;
        }
      }).filter(Boolean);

      console.log(`📋 Loaded ${transactions.length} transactions from file storage`);
      return transactions;
    } catch (error) {
      console.error('❌ Error reading transactions from file:', error);
      return [];
    }
  }

  /**
   * Get transactions for a specific date
   */
  static async getTransactionsForDate(date: string): Promise<any[]> {
    try {
      const allTransactions = await this.getAllTransactions();

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const filteredTransactions = allTransactions.filter(transaction => {
        const createdAt = new Date(transaction.created_at);
        return createdAt >= startOfDay && createdAt <= endOfDay;
      });

      console.log(`📊 Found ${filteredTransactions.length} transactions for ${date}`);
      return filteredTransactions;
    } catch (error) {
      console.error('❌ Error filtering transactions by date:', error);
      return [];
    }
  }

  /**
   * Clear all stored data (for maintenance)
   */
  static async clearAll(): Promise<void> {
    try {
      const filePath = join(this.STORAGE_DIR, this.DATA_FILE);
      await fs.unlink(filePath);
      console.log('🗑️ All stored transactions cleared');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('❌ Error clearing transactions:', error);
      }
    }
  }

  /**
   * Get storage stats
   */
  static async getStats(): Promise<{ totalTransactions: number; fileSizeKB: number }> {
    try {
      const filePath = join(this.STORAGE_DIR, this.DATA_FILE);

      try {
        const stats = await fs.stat(filePath);
        const allTransactions = await this.getAllTransactions();

        return {
          totalTransactions: allTransactions.length,
          fileSizeKB: Math.round(stats.size / 1024),
        };
      } catch {
        return {
          totalTransactions: 0,
          fileSizeKB: 0,
        };
      }
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return {
        totalTransactions: 0,
        fileSizeKB: 0,
      };
    }
  }
}