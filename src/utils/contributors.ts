// GitHub Contributors API Utils
// Utility functions for fetching and caching GitHub contributors data

interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface ContributorData {
  login: string;
  avatar_url: string;
  html_url: string;
  frameworkContributions: number;
  skeletonContributions: number;
  totalContributions: number;
  rank: number;
}

export class ContributorsAPI {
  private static readonly FRAMEWORK_API = 'https://api.github.com/repos/orionis-framework/framework/contributors';
  private static readonly SKELETON_API = 'https://api.github.com/repos/orionis-framework/skeleton/contributors';
  private static readonly CACHE_KEY = 'orionis_contributors_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Fetch contributors from GitHub APIs with caching support
   */
  static async fetchContributors(): Promise<ContributorData[]> {
    try {
      // Check cache first (only in browser environment)
      if (globalThis.window !== undefined) {
        const cached = this.getFromCache();
        if (cached) {
          return cached;
        }
      }

      // Fetch fresh data
      const [frameworkResponse, skeletonResponse] = await Promise.all([
        this.fetchWithRetry(this.FRAMEWORK_API),
        this.fetchWithRetry(this.SKELETON_API)
      ]);

      const frameworkData: GitHubContributor[] = await frameworkResponse.json();
      const skeletonData: GitHubContributor[] = await skeletonResponse.json();

      const contributors = this.mergeContributorData(frameworkData, skeletonData);

      // Cache the result (only in browser environment)
      if (globalThis.window !== undefined) {
        this.saveToCache(contributors);
      }

      return contributors;
    } catch (error) {
      console.error('Error fetching contributors:', error);

      // Try to return cached data as fallback
      if (globalThis.window !== undefined) {
        const cached = this.getFromCache(true); // ignore expiry for fallback
        if (cached) {
          console.log('Returning cached data as fallback');
          return cached;
        }
      }

      return [];
    }
  }

  /**
   * Fetch with retry logic for better reliability
   */
  private static async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Orionis-Framework-Docs'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${url}:`, error);

        if (i === retries - 1) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, i) * 1000);
      }
    }

    throw new Error('All retry attempts failed');
  }

  /**
   * Merge and process contributor data from both repositories
   */
  private static mergeContributorData(
    frameworkData: GitHubContributor[],
    skeletonData: GitHubContributor[]
  ): ContributorData[] {
    const contributorsMap = new Map<string, ContributorData>();

    // Process framework contributors
    for (const contributor of frameworkData) {
      contributorsMap.set(contributor.login, {
        login: contributor.login,
        avatar_url: contributor.avatar_url,
        html_url: contributor.html_url,
        frameworkContributions: contributor.contributions,
        skeletonContributions: 0,
        totalContributions: contributor.contributions,
        rank: 0
      });
    }

    // Process skeleton contributors
    for (const contributor of skeletonData) {
      const existing = contributorsMap.get(contributor.login);
      if (existing) {
        existing.skeletonContributions = contributor.contributions;
        existing.totalContributions += contributor.contributions;
      } else {
        contributorsMap.set(contributor.login, {
          login: contributor.login,
          avatar_url: contributor.avatar_url,
          html_url: contributor.html_url,
          frameworkContributions: 0,
          skeletonContributions: contributor.contributions,
          totalContributions: contributor.contributions,
          rank: 0
        });
      }
    }

    // Convert to array and sort by total contributions
    const contributors = Array.from(contributorsMap.values())
      .sort((a, b) => b.totalContributions - a.totalContributions);

    // Assign ranks
    for (let index = 0; index < contributors.length; index++) {
      contributors[index].rank = index + 1;
    }

    return contributors;
  }

  /**
   * Get cached data if available and not expired
   */
  private static getFromCache(ignoreExpiry = false): ContributorData[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      if (!ignoreExpiry && now - data.timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data.contributors;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Save data to cache with timestamp
   */
  private static saveToCache(contributors: ContributorData[]): void {
    try {
      const data = {
        contributors,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to cache:', error);
    }
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rank badge emoji or text
   */
  static getRankBadge(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }

  /**
   * Get CSS class for rank styling
   */
  static getRankClass(rank: number): string {
    switch (rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return 'rank-default';
    }
  }

  /**
   * Calculate progress percentage for contribution bars
   */
  static getProgressPercentage(contributions: number, maxContributions: number): number {
    return Math.min((contributions / maxContributions) * 100, 100);
  }
}

// Export interfaces for use in components
export type { GitHubContributor, ContributorData };