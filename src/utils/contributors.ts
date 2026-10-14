// GitHub Contributors API Utils
// Utility functions for fetching and caching GitHub contributors data

interface GitHubContributor {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions: number;
  // Anonymous contributor fields
  type?: string;
  name?: string;
}

interface ContributorData {
  login: string;
  avatar_url: string;
  html_url: string;
  frameworkContributions: number;
  skeletonContributions: number;
  docsContributions: number;
  webContributions: number;
  totalContributions: number;
  rank: number;
}

class GitHubContributorsHTTPError extends Error {
  constructor(readonly status: number, statusText: string) {
    super(`HTTP ${status}: ${statusText}`);
  }
}

export class ContributorsAPI {
  private static readonly FRAMEWORK_API = 'https://api.github.com/repos/orionis-framework/framework/contributors?anon=1';
  private static readonly SKELETON_API = 'https://api.github.com/repos/orionis-framework/skeleton/contributors?anon=1';
  private static readonly DOCS_API = 'https://api.github.com/repos/orionis-framework/docs/contributors?anon=1';
  private static readonly WEB_API = 'https://api.github.com/repos/orionis-framework/web/contributors?anon=1';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private static serverCache: { contributors: ContributorData[]; timestamp: number } | null = null;
  private static currentFetch: Promise<ContributorData[]> | undefined;
  private static incompleteData = false;

  // Owner login: direct/owner commits from GitHub are consolidated under this user
  private static readonly OWNER_LOGIN = 'rmunate';
  private static readonly OWNER_AVATAR = 'https://avatars.githubusercontent.com/u/91748598?v=4';
  private static readonly OWNER_URL = 'https://github.com/rmunate';
  private static readonly OWNER_ALIASES: Set<string> = new Set([
    'rmunate',
    'web-flow',           // GitHub web UI / merge commits
  ]);
  // Author names used in commits that should map to the owner (for anonymous contributors)
  private static readonly OWNER_NAMES: Set<string> = new Set([
    'raul mauricio uñate castro',
    'rmunate',
  ]);

  /**
   * Fetch contributors from GitHub APIs with caching support
   */
  static async fetchContributors(): Promise<ContributorData[]> {
    // Both locale pages share one request and one process cache during a build.
    if (this.currentFetch) return this.currentFetch;
    this.currentFetch = this.fetchFreshContributors();
    try {
      return await this.currentFetch;
    } finally {
      this.currentFetch = undefined;
    }
  }

  private static async fetchFreshContributors(): Promise<ContributorData[]> {
    try {
      if (this.serverCache && Date.now() - this.serverCache.timestamp <= this.CACHE_DURATION) {
        return this.serverCache.contributors;
      }

      // One unavailable repository must not discard the other repositories' data.
      const responses = await Promise.allSettled([
        this.fetchAllContributors(this.FRAMEWORK_API),
        this.fetchAllContributors(this.SKELETON_API),
        this.fetchAllContributors(this.DOCS_API),
        this.fetchAllContributors(this.WEB_API)
      ]);
      this.incompleteData = responses.some(response => response.status === 'rejected');
      if (responses.every(response => response.status === 'rejected')) {
        throw new Error('GitHub contributor data is unavailable for all repositories.');
      }
      const [frameworkData, skeletonData, docsData, webData] = responses.map(response => {
        if (response.status === 'fulfilled') return response.value;
        console.warn('A repository could not provide contributor data:', response.reason);
        return [];
      });

      const contributors = this.mergeContributorData(frameworkData, skeletonData, docsData, webData);

      this.serverCache = { contributors, timestamp: Date.now() };

      return contributors;
    } catch (error) {
      this.incompleteData = true;
      console.error('Error fetching contributors:', error);

      // Try to return cached data as fallback
      if (this.serverCache) {
        return this.serverCache.contributors;
      }

      // Cache the unavailable state so the second locale does not repeat failed requests.
      this.serverCache = { contributors: [], timestamp: Date.now() };
      return [];
    }
  }

  /** Retrieve every contributor page, including anonymous contributors. */
  private static async fetchAllContributors(url: string): Promise<GitHubContributor[]> {
    const requestURL = new URL(url);
    requestURL.searchParams.set('per_page', '100');
    const contributors: GitHubContributor[] = [];
    for (let page = 1; ; page++) {
      requestURL.searchParams.set('page', String(page));
      const response = await this.fetchWithRetry(requestURL.toString());
      if (response.status === 204) break;
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error('GitHub returned an invalid contributor list.');
      contributors.push(...data as GitHubContributor[]);
      const links = response.headers.get('link');
      if (links ? !/rel="next"/.test(links) : data.length < 100) break;
    }
    return contributors;
  }

  /**
   * Fetch with retry logic for better reliability
   */
  private static async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Orionis-Framework-Docs'
          }
        });

        if (!response.ok) {
          throw new GitHubContributorsHTTPError(response.status, response.statusText);
        }

        return response;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${url}:`, error);

        // Retrying rate limits or missing repositories immediately cannot resolve them.
        if (error instanceof GitHubContributorsHTTPError && error.status < 500) {
          throw error;
        }

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
   * Resolve a contributor to a login, handling anonymous contributors by name.
   */
  private static resolveContributor(contributor: GitHubContributor): { login: string; avatar: string; url: string } {
    // Anonymous contributor (type === 'Anonymous') — resolve by author name
    if (contributor.type === 'Anonymous') {
      const authorName = (contributor.name ?? '').toLowerCase().trim();
      if (authorName && this.OWNER_NAMES.has(authorName)) {
        return { login: this.OWNER_LOGIN, avatar: this.OWNER_AVATAR, url: this.OWNER_URL };
      }
      // Unknown anonymous contributor — use name as display, identicon as avatar
      const displayName = contributor.name ?? 'Anonymous';
      return {
        login: displayName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=134675&color=fff&size=96`,
        url: ''
      };
    }

    // Known GitHub user — check if it's an owner alias
    const login = this.OWNER_ALIASES.has(contributor.login ?? '') ? this.OWNER_LOGIN : (contributor.login ?? 'unknown');
    const isOwner = login === this.OWNER_LOGIN;
    return {
      login,
      avatar: isOwner ? this.OWNER_AVATAR : (contributor.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(login)}&background=134675&color=fff&size=96`),
      url: isOwner ? this.OWNER_URL : (contributor.html_url ?? '')
    };
  }

  /**
   * Process contributors from a single repository into the shared map.
   */
  private static processRepoContributors(
    repoData: GitHubContributor[],
    repoKey: keyof Pick<ContributorData, 'frameworkContributions' | 'skeletonContributions' | 'docsContributions' | 'webContributions'>,
    contributorsMap: Map<string, ContributorData>
  ): void {
    for (const contributor of repoData) {
      const resolved = this.resolveContributor(contributor);

      if (!contributorsMap.has(resolved.login)) {
        contributorsMap.set(resolved.login, {
          login: resolved.login,
          avatar_url: resolved.avatar,
          html_url: resolved.url,
          frameworkContributions: 0,
          skeletonContributions: 0,
          docsContributions: 0,
          webContributions: 0,
          totalContributions: 0,
          rank: 0
        });
      }

      const entry = contributorsMap.get(resolved.login)!;
      entry[repoKey] += contributor.contributions;
      entry.totalContributions += contributor.contributions;

      // Keep avatar/url updated with the best available data
      if (resolved.avatar && (!entry.avatar_url || resolved.login === this.OWNER_LOGIN)) {
        entry.avatar_url = resolved.avatar;
        entry.html_url = resolved.url;
      }
    }
  }

  /**
   * Merge and process contributor data from all repositories.
   * Commits from owner aliases (e.g. web-flow) are consolidated under the owner account.
   */
  private static mergeContributorData(
    frameworkData: GitHubContributor[],
    skeletonData: GitHubContributor[],
    docsData: GitHubContributor[],
    webData: GitHubContributor[]
  ): ContributorData[] {
    const contributorsMap = new Map<string, ContributorData>();

    this.processRepoContributors(frameworkData, 'frameworkContributions', contributorsMap);
    this.processRepoContributors(skeletonData, 'skeletonContributions', contributorsMap);
    this.processRepoContributors(docsData, 'docsContributions', contributorsMap);
    this.processRepoContributors(webData, 'webContributions', contributorsMap);

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
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Whether some repositories could not be refreshed for this result. */
  static hasIncompleteData(): boolean {
    return this.incompleteData;
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
}
