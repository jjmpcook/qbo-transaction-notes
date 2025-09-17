import { SubscriptionResponse, AuthCache, UserCredentials, AuthStatus } from './types.js';

export class AuthService {
  private static readonly CACHE_KEY = 'qbo_auth_cache';
  private static readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  private static readonly API_ENDPOINT = 'https://eazmvistbyiiepozlpan.supabase.co/functions/v1/validate-subscription';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhem12aXN0YnlpaWVwb3pscGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzc3NzQsImV4cCI6MjA3MDUxMzc3NH0.6eSI51dHvBo2lyOVtB-r7nZd0gxDdLiFs-ape6cjIig'; // Replace with your actual anon key

  // Temporary flag to bypass authentication while endpoint is down
  private static readonly BYPASS_AUTH = true;

  /**
   * Validates subscription with lazy loading and caching
   * Only checks API if cache is expired or missing
   */
  static async validateSubscription(): Promise<boolean> {
    try {
      // Temporary bypass while endpoint is down
      if (this.BYPASS_AUTH) {
        console.log('🔑 Auth: Bypassing authentication (endpoint unavailable)');

        // Get user email for logging purposes
        const userEmail = await this.getUserEmail();
        if (!userEmail) {
          console.log('🔑 Auth: No user email found');
          return false;
        }

        // Cache a valid result to avoid repeated prompts
        await this.setCachedAuth({
          isValid: true,
          plan: 'bypass',
          userId: 'bypass-user',
          timestamp: Date.now(),
          userEmail,
        });

        console.log('🔑 Auth: Bypass authentication successful');
        return true;
      }

      // Check cache first
      const cached = await this.getCachedAuth();
      if (cached && this.isCacheValid(cached)) {
        console.log('🔑 Auth: Using cached validation');
        return cached.isValid;
      }

      // Get user email for validation
      const userEmail = await this.getUserEmail();
      if (!userEmail) {
        console.log('🔑 Auth: No user email found');
        return false;
      }

      // Call API for fresh validation
      console.log('🔑 Auth: Fetching fresh validation');
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'apikey': this.SUPABASE_ANON_KEY, // Supabase also expects this header
        },
        body: JSON.stringify({ userEmail }),
      });

      if (!response.ok) {
        console.error('🔑 Auth: API request failed:', response.status, response.statusText);

        // Log the error response for debugging
        try {
          const errorText = await response.text();
          console.error('🔑 Auth: API error response:', errorText);
        } catch (e) {
          console.error('🔑 Auth: Could not read error response');
        }

        return false;
      }

      const result: SubscriptionResponse = await response.json();

      // Cache the result
      await this.setCachedAuth({
        isValid: result.valid,
        plan: result.plan,
        userId: result.userId,
        timestamp: Date.now(),
        userEmail,
      });

      console.log('🔑 Auth: Validation result:', result.valid ? 'VALID' : 'INVALID');
      return result.valid;

    } catch (error) {
      console.error('🔑 Auth: Validation error:', error);
      return false;
    }
  }

  /**
   * Get user email from storage or prompt user
   */
  private static async getUserEmail(): Promise<string | null> {
    try {
      // Try to get from storage first
      const stored = await chrome.storage.local.get(['userEmail']);
      if (stored.userEmail) {
        return stored.userEmail;
      }

      // If no email stored, we'll need to prompt the user
      // This will be handled by the login UI
      return null;
    } catch (error) {
      console.error('🔑 Auth: Error getting user email:', error);
      return null;
    }
  }

  /**
   * Set user credentials (called from login form)
   */
  static async setUserCredentials(credentials: UserCredentials): Promise<void> {
    try {
      await chrome.storage.local.set({ userEmail: credentials.email });
      // Clear cache to force fresh validation only when setting new credentials
      await this.clearCache();
      console.log('🔑 Auth: User credentials updated');
    } catch (error) {
      console.error('🔑 Auth: Error setting credentials:', error);
    }
  }

  /**
   * Get cached authentication data
   */
  private static async getCachedAuth(): Promise<AuthCache | null> {
    try {
      const result = await chrome.storage.local.get([this.CACHE_KEY]);
      return result[this.CACHE_KEY] || null;
    } catch (error) {
      console.error('🔑 Auth: Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set cached authentication data
   */
  private static async setCachedAuth(auth: AuthCache): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.CACHE_KEY]: auth });
    } catch (error) {
      console.error('🔑 Auth: Error setting cache:', error);
    }
  }

  /**
   * Check if cached data is still valid (within 6 hour window)
   */
  private static isCacheValid(cached: AuthCache): boolean {
    const now = Date.now();
    const age = now - cached.timestamp;
    return age < this.CACHE_DURATION;
  }

  /**
   * Clear authentication cache (forces fresh validation next time)
   */
  static async clearCache(): Promise<void> {
    try {
      await chrome.storage.local.remove([this.CACHE_KEY]);
      console.log('🔑 Auth: Cache cleared');
    } catch (error) {
      console.error('🔑 Auth: Error clearing cache:', error);
    }
  }

  /**
   * Get current authentication status from cache (no API call)
   */
  static async getAuthStatus(): Promise<AuthStatus | null> {
    const cached = await this.getCachedAuth();
    if (cached && this.isCacheValid(cached)) {
      return {
        isValid: cached.isValid,
        plan: cached.plan,
        userId: cached.userId,
      };
    }
    return null;
  }

  /**
   * Logout user (clear all auth data)
   */
  static async logout(): Promise<void> {
    try {
      await chrome.storage.local.remove(['userEmail', this.CACHE_KEY]);
      console.log('🔑 Auth: User logged out');
    } catch (error) {
      console.error('🔑 Auth: Error during logout:', error);
    }
  }

  /**
   * Check if user has valid credentials stored
   */
  static async hasStoredCredentials(): Promise<boolean> {
    try {
      const stored = await chrome.storage.local.get(['userEmail']);
      return !!stored.userEmail;
    } catch (error) {
      console.error('🔑 Auth: Error checking stored credentials:', error);
      return false;
    }
  }
}