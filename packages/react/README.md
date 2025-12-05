# @thebbz/siwe-ethos-react

React components and hooks for integrating "Sign in with Ethos" authentication into your React application. Provides a beautiful, animated modal for wallet-based and social authentication.

## Installation

```bash
npm install @thebbz/siwe-ethos-react
# or
yarn add @thebbz/siwe-ethos-react
# or
pnpm add @thebbz/siwe-ethos-react
```

## Peer Dependencies

This package requires React 17+ and React DOM 17+:

```bash
npm install react react-dom
```

## Quick Start

### Using the Auth Modal

The `EthosAuthModal` component provides a complete authentication experience with wallet connection and social logins.

```tsx
import { useState } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';
import '@thebbz/siwe-ethos-react/styles.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  const handleSuccess = (result: EthosAuthResult) => {
    console.log('Authenticated:', result);
    setUser(result);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        {user ? `Signed in as ${user.profile.displayName}` : 'Sign In'}
      </button>

      <EthosAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### Modal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Called when modal should close |
| `onSuccess` | `(result: EthosAuthResult) => void` | Yes | Called on successful authentication |
| `baseUrl` | `string` | No | Override the auth server URL |
| `showProviders` | `string[]` | No | Filter which providers to show |

### Authentication Result

The `onSuccess` callback receives an `EthosAuthResult` object:

```typescript
interface EthosAuthResult {
  profile: {
    id: number;
    address: string;
    primaryAddress: string;
    displayName: string | null;
    username: string | null;
    description: string | null;
    avatar: string | null;
    score: number;
    profileUrl: string;
  };
  provider: 'wallet' | 'farcaster' | 'discord' | 'twitter' | 'telegram';
  providerData?: {
    // Provider-specific data (e.g., Farcaster FID, Discord username)
  };
}
```

## Supported Authentication Methods

### Wallet Authentication (SIWE)
- MetaMask
- Rabby
- Phantom
- Zerion
- Coinbase Wallet
- Brave Wallet
- Any EIP-1193 compatible wallet

### Social Authentication
- **Farcaster** - QR code authentication via Warpcast
- **Discord** - OAuth2 redirect flow
- **Twitter/X** - OAuth2 redirect flow
- **Telegram** - Widget-based authentication

## Using Individual Components

You can also import individual components for more control:

```tsx
import { SignInButton } from '@thebbz/siwe-ethos-react';
```

## Hooks

### `useEthosAuth`

Hook for managing authentication state:

```tsx
import { useEthosAuth } from '@thebbz/siwe-ethos-react/hooks';

function MyComponent() {
  const { user, isLoading, signIn, signOut } = useEthosAuth();

  if (isLoading) return <div>Loading...</div>;
  if (user) return <div>Hello, {user.displayName}!</div>;
  
  return <button onClick={signIn}>Sign In</button>;
}
```

## Styling

The modal comes with default styles. Import the CSS file to use them:

```tsx
import '@thebbz/siwe-ethos-react/styles.css';
```

### Custom Styling

You can override styles using CSS custom properties:

```css
:root {
  --ethos-modal-bg: #1a1a1a;
  --ethos-modal-text: #ffffff;
  --ethos-primary: #2E7BC3;
  --ethos-primary-hover: #3d8bd4;
}
```

Or target specific classes:

```css
.ethos-modal {
  /* Modal container styles */
}

.ethos-modal-content {
  /* Modal content styles */
}

.ethos-provider-button {
  /* Provider button styles */
}
```

## TypeScript Support

This package is written in TypeScript and includes type definitions. All types are exported from the main package:

```tsx
import type { 
  EthosAuthResult,
  EthosAuthModalProps,
  EthosProvider 
} from '@thebbz/siwe-ethos-react';
```

## Server Configuration

The modal expects your server to have the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/nonce` | GET | Generate SIWE nonce |
| `/api/auth/wallet/verify` | POST | Verify wallet signature |
| `/auth/farcaster` | GET | Start Farcaster auth |
| `/auth/farcaster/callback` | GET | Farcaster polling endpoint |
| `/auth/discord` | GET | Start Discord OAuth |
| `/auth/twitter` | GET | Start Twitter OAuth |
| `/auth/telegram` | GET | Start Telegram auth |

See the [self-hosting documentation](../../docs/self-hosting.md) for setup instructions.

## Example: Complete Integration

```tsx
import { useState, useEffect } from 'react';
import { EthosAuthModal, EthosAuthResult } from '@thebbz/siwe-ethos-react';
import '@thebbz/siwe-ethos-react/styles.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<EthosAuthResult | null>(null);

  // Check for stored session on mount
  useEffect(() => {
    const stored = localStorage.getItem('ethos_user');
    if (stored) {
      setUser(JSON.parse(stored));
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

  return (
    <div>
      {user ? (
        <div>
          <img src={user.profile.avatar} alt={user.profile.displayName || 'User'} />
          <span>{user.profile.displayName || user.profile.username}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => setIsModalOpen(true)}>
          Sign in with Ethos
        </button>
      )}

      <EthosAuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## Related Packages

- [`@thebbz/siwe-ethos`](../sdk/README.md) - Core SDK for authentication
- [`@thebbz/siwe-ethos-providers`](../providers/README.md) - Authentication providers

## License

MIT © [thebbz](https://github.com/thebbz)
