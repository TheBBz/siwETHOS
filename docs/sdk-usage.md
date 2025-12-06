# SDK Usage Guide

This guide covers integrating Sign in with Ethos into your web application using wallet-based authentication (SIWE).

> **Quick Links:**
> - [npm: @thebbz/siwe-ethos](https://www.npmjs.com/package/@thebbz/siwe-ethos)
> - [Live Demo](https://ethos.thebbz.xyz)
> - [GitHub Repository](https://github.com/TheBBz/siwETHOS)
> - [React Components](./react-components.md) - For an easier integration with React

## Installation

### npm/pnpm/yarn

```bash
npm install @thebbz/siwe-ethos
# or
pnpm add @thebbz/siwe-ethos
# or
yarn add @thebbz/siwe-ethos
```

### CDN

```html
<script src="https://unpkg.com/@thebbz/siwe-ethos"></script>
```

The SDK will be available as `window.EthosWalletAuth`.

## Quick Start

### 1. Initialize the SDK

```typescript
import { EthosWalletAuth } from '@thebbz/siwe-ethos';

const auth = EthosWalletAuth.init({
  authServerUrl: 'https://ethos.thebbz.xyz', // or your self-hosted URL
});
```

**Using environment variables (recommended for frameworks):**

```typescript
// Next.js, Vite, or other frameworks with env support
const auth = EthosWalletAuth.init({
  authServerUrl: process.env.NEXT_PUBLIC_ETHOS_AUTH_URL,
});
```

### 2. Connect Wallet & Sign In

Using [wagmi](https://wagmi.sh/) (recommended for React):

```typescript
import { useAccount, useSignMessage } from 'wagmi';

function SignInButton() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleSignIn = async () => {
    if (!address) return;
    
    try {
      const result = await auth.signIn(address, signMessageAsync);
      
      // User is now authenticated
      console.log('Welcome!', result.user.name);
      console.log('Ethos Score:', result.user.ethosScore);
      console.log('Wallet:', result.user.walletAddress);
      
      // Store the token
      localStorage.setItem('ethos_token', result.accessToken);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (!isConnected) {
    return <w3m-button />; // WalletConnect button
  }

  return (
    <button onClick={handleSignIn}>
      Sign in with Ethos
    </button>
  );
}
```

## Full Examples

### React + wagmi

```tsx
// providers.tsx
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EthosWalletAuth } from '@thebbz/siwe-ethos';

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

// Initialize Ethos auth
export const ethosAuth = EthosWalletAuth.init({
  authServerUrl: process.env.NEXT_PUBLIC_AUTH_SERVER_URL || 'https://ethos.thebbz.xyz',
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

```tsx
// components/SignInWithEthos.tsx
import { useAccount, useSignMessage, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';
import { ethosAuth } from '../providers';

export function SignInWithEthos({ onSuccess }: { onSuccess?: (user: any) => void }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ethosAuth.signIn(address, signMessageAsync);
      onSuccess?.(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div>
        <p>Connect your wallet to sign in with Ethos</p>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
          >
            {connector.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
      
      <button onClick={handleSignIn} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in with Ethos'}
      </button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
```

### Vanilla JavaScript with ethers.js

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sign in with Ethos</title>
  <script src="https://unpkg.com/ethers@6/dist/ethers.umd.min.js"></script>
  <script src="https://unpkg.com/@thebbz/siwe-ethos"></script>
</head>
<body>
  <button id="connect-btn">Connect Wallet</button>
  <button id="signin-btn" disabled>Sign in with Ethos</button>
  <div id="status"></div>

  <script>
    let provider, signer, address;
    
    const auth = EthosWalletAuth.init({
      authServerUrl: 'https://ethos.thebbz.xyz'
    });

    document.getElementById('connect-btn').onclick = async () => {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        address = await signer.getAddress();
        
        document.getElementById('status').textContent = 
          `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`;
        document.getElementById('signin-btn').disabled = false;
      } catch (err) {
        document.getElementById('status').textContent = 'Failed to connect: ' + err.message;
      }
    };

    document.getElementById('signin-btn').onclick = async () => {
      try {
        document.getElementById('status').textContent = 'Signing in...';
        
        // Sign message function for ethers.js
        const signMessage = async (message) => {
          return await signer.signMessage(message);
        };
        
        const result = await auth.signIn(address, signMessage);
        
        document.getElementById('status').innerHTML = `
          <strong>Welcome, ${result.user.name}!</strong><br>
          Ethos Score: ${result.user.ethosScore}<br>
          Wallet: ${result.user.walletAddress}
        `;
        
        // Store token
        localStorage.setItem('ethos_token', result.accessToken);
      } catch (err) {
        document.getElementById('status').textContent = 'Sign in failed: ' + err.message;
      }
    };
  </script>
</body>
</html>
```

## SDK Reference

### Global Configuration

Set default configuration that applies to all SDK instances. This is useful for setting your auth server URL once at app startup.

```typescript
import { setGlobalConfig, EthosWalletAuth } from '@thebbz/siwe-ethos';

// Set once at app initialization (e.g., in _app.tsx or main.ts)
setGlobalConfig({
  authServerUrl: process.env.NEXT_PUBLIC_ETHOS_AUTH_URL || 'https://ethos.thebbz.xyz',
  chainId: 1,
});

// All instances will use these defaults
const auth = EthosWalletAuth.init(); // No config needed!
```

**Configuration priority:** instance config > global config > defaults

```typescript
// Global config
setGlobalConfig({ authServerUrl: 'https://global.example.com' });

// Instance overrides global
const auth = EthosWalletAuth.init({
  authServerUrl: 'https://instance.example.com', // This wins
});
```

**Other global config functions:**

```typescript
import { getGlobalConfig, resetGlobalConfig } from '@thebbz/siwe-ethos';

// Get current global config
const config = getGlobalConfig();

// Reset to defaults
resetGlobalConfig();
```

### `EthosWalletAuth.init(config)`

Initialize the SDK with configuration.

```typescript
interface WalletAuthConfig {
  /** Base URL of the Ethos auth server */
  authServerUrl?: string; // default: 'https://ethos.thebbz.xyz'
  
  /** Chain ID for Ethereum network */
  chainId?: number; // default: 1 (mainnet)
  
  /** Custom statement for SIWE message */
  statement?: string;
  
  /** Session expiry time in seconds */
  expirationTime?: number; // default: 86400 (24 hours)
}
```

### `auth.signIn(address, signMessage)`

Authenticate with wallet signature.

**Parameters:**
- `address` - Ethereum wallet address
- `signMessage` - Function that signs a message (from wagmi, ethers, etc.)

**Returns:** `Promise<WalletAuthResult>`

```typescript
interface WalletAuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: EthosUser;
}

interface EthosUser {
  sub: string;              // Unique ID (ethos:profileId)
  name: string;             // Display name
  picture: string | null;   // Avatar URL
  ethosProfileId: number;   // Ethos profile ID
  ethosUsername: string | null;
  ethosScore: number;       // Credibility score (0-2800)
  ethosStatus: string;      // Profile status
  ethosAttestations: string[]; // Verified accounts
  authMethod: 'wallet';
  walletAddress: string;
  profileUrl?: string;      // URL to Ethos profile
}
```

### `auth.getNonce()`

Get a fresh nonce for SIWE message.

```typescript
const { nonce, expiresAt } = await auth.getNonce();
```

### `auth.verify(params)`

Verify a signed SIWE message.

```typescript
const result = await auth.verify({
  message: siweMessage,
  signature: '0x...',
  address: '0x...',
});
```

## Session Management

The SDK provides built-in session management with automatic token refresh:

### SessionManager

```typescript
import { SessionManager, createStorage } from '@thebbz/siwe-ethos';

// Create a storage adapter ('browser' for localStorage, 'memory' for in-memory)
const storage = createStorage('browser');

// Initialize the session manager
const sessionManager = new SessionManager({
  storage,
  refreshEndpoint: '/api/auth/token',
  autoRefresh: true,        // Automatically refresh tokens before expiry
  refreshThreshold: 300,    // Refresh 5 minutes before expiry
});

// Set session after authentication
const result = await auth.signIn(address, signMessage);
sessionManager.setSession({
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
  expiresAt: Date.now() + result.expiresIn * 1000,
  user: result.user,
});

// Listen for auth state changes
const unsubscribe = sessionManager.onAuthStateChange((session) => {
  console.log('Auth state:', session.isAuthenticated);
  console.log('User:', session.user);
});

// Get current session
const session = sessionManager.getSession();
if (session.isAuthenticated) {
  console.log('Welcome back,', session.user?.name);
}

// Logout
sessionManager.logout();

// Clean up when done
sessionManager.destroy();
unsubscribe();
```

### Storage Adapters

```typescript
import { BrowserStorage, MemoryStorage, createStorage } from '@thebbz/siwe-ethos';

// Use localStorage (persists across browser sessions)
const browserStorage = new BrowserStorage('my_app_session');

// Use in-memory storage (clears on page refresh)
const memoryStorage = new MemoryStorage();

// Or use the factory function
const storage = createStorage('browser'); // or 'memory'
```

### Token Refresh

The session manager can automatically refresh tokens before they expire:

```typescript
const sessionManager = new SessionManager({
  storage: createStorage('browser'),
  refreshEndpoint: '/api/auth/token',  // Your token refresh endpoint
  autoRefresh: true,
  refreshThreshold: 300,  // Refresh 5 minutes before expiry
});

// Manually refresh if needed
await sessionManager.refreshToken();
```

**Server endpoint example (Next.js):**

```typescript
// app/api/auth/token/route.ts
export async function POST(request: Request) {
  const { refresh_token } = await request.json();
  
  // Verify and issue new tokens...
  
  return Response.json({
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_in: 3600,
  });
}
```

## Security Best Practices

1. **Never expose secrets client-side** - The SDK is designed for client-side use and doesn't require secrets.

2. **Validate tokens server-side** - Always verify JWT tokens on your backend before trusting user data.

3. **Use HTTPS** - Always serve your app over HTTPS to prevent man-in-the-middle attacks.

4. **Handle errors gracefully** - Wrap sign-in calls in try/catch and show user-friendly error messages.

## Message Security

The SIWE message shown to users includes clear security information:

```
example.com wants you to sign in with your Ethereum account:
0x1234...5678

Sign in with Ethos to verify your wallet ownership.

This is a signature request, NOT a transaction.
It will not cost any gas fees or move any funds.
Your wallet address will be used to fetch your Ethos profile.

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: abc123...
Issued At: 2025-12-05T12:00:00.000Z
Expiration Time: 2025-12-05T12:05:00.000Z
```

This message clearly communicates to users that:
- This is NOT a transaction
- No gas fees will be charged
- No funds will be moved
- Only wallet ownership verification

## Troubleshooting

### "No Ethos profile found"

The wallet address doesn't have an Ethos profile. Users need to create one at [ethos.network](https://ethos.network).

### "Signature rejected"

User cancelled the signature request in their wallet. This is expected behavior.

### "Nonce expired"

The sign-in took too long. Request a new nonce and try again.

### "Invalid signature"

The signature doesn't match the message or address. Ensure you're passing the correct parameters.
