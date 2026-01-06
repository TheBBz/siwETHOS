/**
 * GitHub OAuth Provider Types
 */

/**
 * GitHub OAuth2 configuration
 */
export interface GithubConfig {
  /** GitHub application client ID */
  clientId: string;
  /** GitHub application client secret */
  clientSecret: string;
  /** OAuth2 redirect URI */
  redirectUri: string;
  /** OAuth2 scopes (default: []) */
  scopes?: string[];
}

/**
 * GitHub user from API
 */
export interface GithubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub OAuth2 token response
 */
export interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Result from GitHub OAuth callback
 */
export interface GithubCallbackResult {
  /** GitHub user info */
  user: GithubUser;
  /** Access token */
  accessToken: string;
}

/**
 * Ethos lookup key for GitHub users
 */
export interface GithubEthosLookup {
  /** Provider identifier */
  provider: 'github';
  /** GitHub user ID */
  userId: string;
  /** GitHub username */
  username: string;
}
