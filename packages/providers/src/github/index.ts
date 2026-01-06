/**
 * GitHub OAuth2 Provider
 *
 * Handles GitHub OAuth2 flow for Sign in with Ethos.
 */

import type {
    GithubConfig,
    GithubUser,
    GithubTokenResponse,
    GithubCallbackResult,
    GithubEthosLookup,
} from './types';

export * from './types';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

/**
 * Generate a cryptographically secure random state for CSRF protection
 */
function generateState(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint8Array(32);
    crypto.getRandomValues(randomValues);
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

/**
 * GitHub OAuth2 Provider
 */
export class GithubProvider {
    private config: GithubConfig;
    private scopes: string[];

    constructor(config: GithubConfig) {
        this.config = config;
        this.scopes = config.scopes ?? ['read:user', 'user:email'];
    }

    /**
     * Get the GitHub OAuth2 authorization URL
     *
     * @param params - Authorization parameters
     * @returns Object containing the URL and the state parameter used
     */
    getAuthorizationUrl(params: { state?: string } = {}): { url: string; state: string } {
        const state = params.state ?? generateState();
        const url = new URL('/authorize', GITHUB_OAUTH_BASE);
        url.searchParams.set('client_id', this.config.clientId);
        url.searchParams.set('redirect_uri', this.config.redirectUri);
        if (this.scopes.length > 0) {
            url.searchParams.set('scope', this.scopes.join(' '));
        }
        url.searchParams.set('state', state);
        return { url: url.toString(), state };
    }

    /**
     * Exchange authorization code for tokens and fetch user info
     */
    async handleCallback(code: string): Promise<GithubCallbackResult> {
        const tokens = await this.exchangeCode(code);
        const user = await this.fetchUser(tokens.access_token);

        return {
            user,
            accessToken: tokens.access_token,
        };
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string): Promise<GithubTokenResponse> {
        const response = await fetch(`${GITHUB_OAUTH_BASE}/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code,
                redirect_uri: this.config.redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`GitHub token exchange failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(`GitHub token exchange failed: ${data.error_description || data.error}`);
        }

        return data;
    }

    /**
     * Fetch GitHub user info
     */
    async fetchUser(accessToken: string): Promise<GithubUser> {
        const response = await fetch(`${GITHUB_API_BASE}/user`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch GitHub user: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the Ethos lookup key from callback result
     */
    getEthosLookup(result: GithubCallbackResult): GithubEthosLookup {
        return {
            provider: 'github',
            userId: result.user.id.toString(),
            username: result.user.login,
        };
    }
}
