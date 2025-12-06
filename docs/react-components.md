# React Components Guide

This guide covers using the `@thebbz/siwe-ethos-react` package to add "Sign in with Ethos" authentication to your React application.

> **Quick Links:**
> - [npm: @thebbz/siwe-ethos-react](https://www.npmjs.com/package/@thebbz/siwe-ethos-react)
> - [Live Demo](https://ethos.thebbz.xyz)
> - [GitHub Repository](https://github.com/TheBBz/siwETHOS)

## Installation

```bash
npm install @thebbz/siwe-ethos-react
# or
pnpm add @thebbz/siwe-ethos-react
# or
yarn add @thebbz/siwe-ethos-react
```

### Peer Dependencies

This package requires React 17+ and React DOM 17+:

```bash
npm install react react-dom
```

## Quick Start

The easiest way to add authentication is with the `EthosAuthModal` component:

```tsx
import { useState } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  const handleSuccess = (result: EthosAuthResult) => {
    console.log('Authenticated:', result);
    setUser(result);
    setIsOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        {user ? `Hello, ${user.profile.displayName}` : 'Sign in with Ethos'}
      </button>

      <EthosAuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

## EthosAuthModal

The modal provides a complete authentication experience with:

- **Wallet Authentication** - MetaMask, Rabby, Phantom, Zerion, Coinbase, Brave
- **Social Logins** - Farcaster, Discord, Twitter/X, Telegram

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Called when modal should close |
| `onSuccess` | `(result: EthosAuthResult) => void` | Yes | Called on successful authentication |
| `baseUrl` | `string` | No | Override the auth server URL (default: `https://ethos.thebbz.xyz`) |
| `showProviders` | `string[]` | No | Filter which providers to show |

### Example with Custom Base URL

```tsx
<EthosAuthModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={handleSuccess}
  baseUrl="https://your-self-hosted-server.com"
/>
```

### Example with Filtered Providers

```tsx
// Only show wallet and Farcaster options
<EthosAuthModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={handleSuccess}
  showProviders={['wallet', 'farcaster']}
/>
```

## Authentication Result

The `onSuccess` callback receives an `EthosAuthResult` object:

```typescript
interface EthosAuthResult {
  profile: {
    id: number;              // Ethos profile ID
    address: string;         // Wallet address used for auth
    primaryAddress: string;  // Primary wallet address
    displayName: string | null;
    username: string | null;
    description: string | null;
    avatar: string | null;
    score: number;           // Credibility score (0-2800)
    profileUrl: string;      // Link to Ethos profile
  };
  provider: 'wallet' | 'farcaster' | 'discord' | 'twitter' | 'telegram';
  providerData?: {
    // Provider-specific data
    // For Farcaster: fid, username, displayName, pfpUrl
    // For Discord: id, username, avatar
    // etc.
  };
}
```

## Supported Authentication Methods

### Wallet Authentication (SIWE)

Users connect their Ethereum wallet and sign a message to prove ownership. No transaction or gas fees required.

**Supported Wallets:**
- MetaMask
- Rabby
- Phantom
- Zerion
- Coinbase Wallet
- Brave Wallet
- Any EIP-1193 compatible wallet

### Social Authentication

| Provider | Auth Type | Notes |
|----------|-----------|-------|
| Farcaster | QR Code / Direct | Scans QR with Warpcast app |
| Discord | OAuth2 Redirect | Redirects to Discord login |
| Twitter/X | OAuth2 Redirect | Redirects to Twitter login |
| Telegram | Widget | Uses Telegram Login Widget |

## Complete Example with Session Persistence

For simple session persistence, you can use localStorage manually. However, for production apps we recommend using the `EthosAuthProvider` which handles session management, token refresh, and more.

### Manual Approach (Simple)

```tsx
import { useState, useEffect } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('ethos_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('ethos_user');
      }
    }
  }, []);

  const handleSuccess = (result: EthosAuthResult) => {
    setUser(result);
    localStorage.setItem('ethos_user', JSON.stringify(result));
    setIsModalOpen(false);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('ethos_user');
  };

  // ...
}
```

### Using EthosAuthProvider (Recommended)

The `EthosAuthProvider` is a context provider that handles:
- Automatic session restoration from storage
- Token refresh before expiry
- Centralized auth state accessible via hooks
- Type-safe access to user data and scores

```tsx
import { 
  EthosAuthProvider, 
  useEthosSession,
  useEthosUser,
  useEthosScore,
  useMinScore
} from '@thebbz/siwe-ethos-react';

// Wrap your app with the provider
function App() {
  return (
    <EthosAuthProvider 
      storageType="browser"  // 'browser' | 'memory'
      refreshEndpoint="/api/auth/token"
      autoRefresh={true}
      onAuthStateChange={(session) => {
        console.log('Auth state changed:', session.isAuthenticated);
      }}
    >
      <YourApp />
    </EthosAuthProvider>
  );
}

function YourApp() {
  const { login, logout, isAuthenticated, isLoading } = useEthosSession();
  const { user } = useEthosUser();
  const { score, tier, tierColor } = useEthosScore();
  const { meetsRequirement, score: userScore } = useMinScore(1000);

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <button onClick={() => {/* open modal and call login() on success */}}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <p>Score: {score} ({tier})</p>
      <p style={{ color: tierColor }}>Tier Color</p>
      {meetsRequirement ? (
        <p>✓ Access granted (score: {userScore})</p>
      ) : (
        <p>✗ Need score ≥1000</p>
      )}
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

## EthosAuthProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `storageType` | `'browser' \| 'memory'` | `'memory'` | Where to persist session |
| `storageKey` | `string` | `'ethos_auth_session'` | Storage key for session data |
| `refreshEndpoint` | `string` | `/api/auth/token` | Endpoint for token refresh |
| `autoRefresh` | `boolean` | `true` | Auto-refresh tokens before expiry |
| `refreshThreshold` | `number` | `300` | Seconds before expiry to refresh |
| `onAuthStateChange` | `(session) => void` | - | Callback on auth state changes |

## Session Hooks

### useEthosSession

Primary hook for session management:

```tsx
const {
  session,        // Full session state (SessionState)
  isAuthenticated,
  isLoading,
  login,         // (result: AuthResult) => void
  logout,        // () => void
  refreshToken,  // () => Promise<void>
} = useEthosSession();
```

### useEthosUser

Access user data with loading states:

```tsx
const { 
  user,      // EthosUser | null
  isLoading, 
  isAuthenticated 
} = useEthosUser();
```

### useEthosScore

Get score with tier calculation:

```tsx
const { 
  score,     // number | null
  tier,      // 'untrusted' | 'neutral' | 'trusted' | 'highly-trusted' | 'exemplary'
  tierColor, // CSS color string for the tier
  isLoading 
} = useEthosScore();
```

### useMinScore

Check if user meets a minimum score requirement:

```tsx
const { 
  meetsRequirement,  // boolean
  score,             // number | null
  requiredScore,     // the minScore you passed in
  isLoading 
} = useMinScore(1000);
```

### useIsAuthenticated

Simple auth check:

```tsx
const { isAuthenticated, isLoading } = useIsAuthenticated();
```

### useAccessToken

Get current access token:

```tsx
const token = useAccessToken(); // string | null
```

### useIsInsideEthosProvider

Check if inside provider (useful for conditional rendering):

```tsx
const isInProvider = useIsInsideEthosProvider();
if (!isInProvider) {
  return <p>Please wrap with EthosAuthProvider</p>;
}
```

## Server Configuration

For the modal to work, your backend needs these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | GET | Generate SIWE nonce |
| `/api/auth/wallet/verify` | POST | Verify wallet signature |
| `/auth/farcaster` | GET | Start Farcaster auth |
| `/auth/farcaster/callback` | GET | Farcaster polling |
| `/auth/discord` | GET | Start Discord OAuth |
| `/auth/twitter` | GET | Start Twitter OAuth |
| `/auth/telegram` | GET | Start Telegram auth |

By default, these are handled by `https://ethos.thebbz.xyz`. For self-hosting, see the [Self-Hosting Guide](./self-hosting.md).

## TypeScript Support

All types are exported from the main package:

```tsx
import type { 
  EthosAuthResult,
  EthosAuthModalProps,
  EthosProvider,
  EthosProfile
} from '@thebbz/siwe-ethos-react';
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## Troubleshooting

### Modal doesn't open
- Ensure `isOpen` state is being set to `true`
- Check for CSS conflicts with `z-index`

### Wallet not detected
- Ensure the wallet extension is installed
- Some wallets need to be unlocked first
- Check browser console for errors

### "No Ethos profile found"
- User needs to create an Ethos profile at [ethos.network](https://ethos.network)
- The wallet/social account must be linked to their Ethos profile

### Social auth popup blocked
- Ensure popups are allowed for your domain
- Some browsers block popups not triggered by user interaction

## Related Packages

- [`@thebbz/siwe-ethos`](https://www.npmjs.com/package/@thebbz/siwe-ethos) - Core SDK for lower-level integration
- [`@thebbz/siwe-ethos-providers`](https://www.npmjs.com/package/@thebbz/siwe-ethos-providers) - Server-side SIWE utilities

## Links

- [npm Package](https://www.npmjs.com/package/@thebbz/siwe-ethos-react)
- [GitHub Repository](https://github.com/TheBBz/siwETHOS)
- [Live Demo](https://ethos.thebbz.xyz)
- [Ethos Network](https://ethos.network)
