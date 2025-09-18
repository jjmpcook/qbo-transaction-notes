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
   * Get transactions for a specific date (Pacific Time)
   */
  static async getTransactionsForDate(date: string): Promise<any[]> {
    try {
      const allTransactions = await this.getAllTransactions();

      // Convert target date to Pacific Time boundaries
      const targetDate = new Date(date + 'T00:00:00');

      // Get start and end of day in Pacific Time, then convert to UTC for comparison
      const startOfDayPacific = new Date(targetDate.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
      }));
      startOfDayPacific.setHours(0, 0, 0, 0);

      const endOfDayPacific = new Date(targetDate.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
      }));
      endOfDayPacific.setHours(23, 59, 59, 999);

      // Convert Pacific time boundaries to UTC for comparison with stored UTC timestamps
      const utcOffset = new Date().getTimezoneOffset() * 60000;
      const pacificOffset = 8 * 60 * 60 * 1000; // Pacific is UTC-8 (or UTC-7 in DST)

      const startOfDayUTC = new Date(startOfDayPacific.getTime() + pacificOffset);
      const endOfDayUTC = new Date(endOfDayPacific.getTime() + pacificOffset);

      const filteredTransactions = allTransactions.filter(transaction => {
        const createdAt = new Date(transaction.created_at);

        // Convert stored UTC time to Pacific for comparison
        const createdAtPacific = new Date(createdAt.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles'
        }));

        const createdDatePacific = createdAtPacific.toLocaleDateString('en-CA', {
          timeZone: 'America/Los_Angeles'
        });

        return createdDatePacific === date;
      });

      console.log(`📊 Found ${filteredTransactions.length} transactions for ${date} (Pacific Time)`);
      console.log(`📅 Searched transactions from ${allTransactions.length} total records`);

      if (filteredTransactions.length > 0) {
        console.log('📝 Sample transaction times:');
        filteredTransactions.slice(0, 3).forEach(t => {
          const pacificTime = new Date(t.created_at).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles'
          });
          console.log(`   - ${t.id}: ${pacificTime} Pacific`);
        });
      }

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