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

  if (user) {
    return (
      <div className="user-card">
        {user.profile.avatar && (
          <img 
            src={user.profile.avatar} 
            alt={user.profile.displayName || 'User'} 
            className="avatar"
          />
        )}
        <div className="user-info">
          <h3>{user.profile.displayName || user.profile.username}</h3>
          <p>Score: {user.profile.score}</p>
          <p>Signed in via {user.provider}</p>
        </div>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Sign in with Ethos
      </button>

      <EthosAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
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
