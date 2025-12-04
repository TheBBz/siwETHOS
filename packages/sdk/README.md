# @signinwithethos/js

JavaScript SDK for integrating "Sign in with Ethos" authentication into any web application using wallet-based authentication (SIWE - Sign-In with Ethereum).

## Installation

```bash
npm install @signinwithethos/js
# or
yarn add @signinwithethos/js
# or
pnpm add @signinwithethos/js
```

## Quick Start

### Wallet-Based Authentication (Recommended)

Users connect their Ethereum wallet, sign a message to prove ownership, and are authenticated if their wallet address has an Ethos profile.

#### 1. Initialize the SDK

```javascript
import { EthosWalletAuth } from '@signinwithethos/js';

const auth = EthosWalletAuth.init({
  // Optional: customize settings
  authServerUrl: 'https://ethos.thebbz.xyz',
  chainId: 1,                           // Ethereum mainnet
  statement: 'Sign in with Ethos',      // Message shown to user
  expirationTime: 86400,                // 24 hours
});
```

#### 2. Authenticate with Wallet

**Option A: Using wagmi/viem (Recommended)**

```javascript
import { useAccount, useSignMessage } from 'wagmi';

function LoginButton() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleLogin = async () => {
    try {
      const result = await auth.signIn(address, (message) => 
        signMessageAsync({ message })
      );
      
      console.log('Welcome,', result.user.name);
      console.log('Credibility score:', result.user.ethosScore);
      console.log('Access token:', result.accessToken);
    } catch (error) {
      console.error('Authentication failed:', error.message);
    }
  };

  return <button onClick={handleLogin}>Sign in with Ethos</button>;
}
```

**Option B: Step-by-step flow**

```javascript
// Step 1: Get a nonce
const { nonce } = await auth.getNonce();

// Step 2: Create the SIWE message
const { messageString } = auth.createMessage(walletAddress, nonce);

// Step 3: Sign with wallet (using your wallet library)
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [messageString, walletAddress],
});

// Step 4: Verify and authenticate
const result = await auth.verify({
  message: messageString,
  signature,
  address: walletAddress,
});
```

**Option C: Redirect to hosted page**

```javascript
// Redirect to Ethos-hosted wallet connect page
auth.redirect('https://yourapp.com/callback', 'csrf-token');
```

### 3. Using the Access Token

```javascript
// Store the access token
localStorage.setItem('ethos_token', result.accessToken);

// Fetch user profile later
const user = await auth.getUser(accessToken);
```

## API Reference

### `EthosWalletAuth.init(config?)`

Initialize the wallet auth client.

```typescript
interface WalletAuthConfig {
  authServerUrl?: string;    // default: 'https://ethos.thebbz.xyz'
  chainId?: number;          // default: 1 (Ethereum mainnet)
  statement?: string;        // default: 'Sign in with Ethos'
  expirationTime?: number;   // default: 86400 (24 hours)
}
```

### `auth.signIn(address, signMessage)`

Complete sign-in flow with a wallet signature function.

```javascript
const result = await auth.signIn(
  '0x1234...5678',
  (message) => signMessageAsync({ message })
);
```

### `auth.getNonce()`

Get a cryptographic nonce for the SIWE message.

```javascript
const { nonce, expiresAt } = await auth.getNonce();
```

### `auth.createMessage(address, nonce, options?)`

Create a SIWE message to be signed.

```javascript
const { message, messageString } = auth.createMessage(address, nonce, {
  state: 'optional-state',
  requestId: 'optional-request-id',
});
```

### `auth.verify(params)`

Verify a signed SIWE message and authenticate.

```javascript
const result = await auth.verify({
  message: messageString,
  signature: '0x...',
  address: '0x...',
});
```

### `auth.redirect(redirectUri, state?)`

Redirect to the hosted wallet connect page.

### `auth.getUser(accessToken)`

Fetch user profile using an access token.

### User Object

```typescript
interface EthosUser {
  sub: string;                    // Unique identifier (ethos:profileId)
  name: string;                   // Display name
  picture: string | null;         // Avatar URL
  ethosProfileId: number;         // Ethos profile ID
  ethosUsername: string | null;   // Ethos username
  ethosScore: number;             // Credibility score (0-2800)
  ethosStatus: string;            // ACTIVE, INACTIVE, MERGED
  ethosAttestations: string[];    // Verified accounts/userkeys
  authMethod: 'wallet';           // Authentication method
  walletAddress: string;          // Connected wallet address
}
```

### Error Handling

```typescript
import { EthosAuthError } from '@signinwithethos/js';

try {
  const result = await auth.signIn(address, signMessage);
} catch (error) {
  if (error instanceof EthosAuthError) {
    switch (error.code) {
      case 'no_ethos_profile':
        // User doesn't have an Ethos profile
        window.location.href = 'https://ethos.network';
        break;
      case 'signature_rejected':
        // User rejected the signature request
        console.log('Please sign the message to continue');
        break;
      default:
        console.error('Auth error:', error.message);
    }
  }
}
```

## SIWE Message Format

The SDK uses the EIP-4361 Sign-In with Ethereum standard:

```
ethos.network wants you to sign in with your Ethereum account:
0x1234...5678

Sign in with Ethos - Verify your identity to access your Ethos profile.

URI: https://yourapp.com
Version: 1
Chain ID: 1
Nonce: abc123...
Issued At: 2024-01-01T00:00:00.000Z
Expiration Time: 2024-01-02T00:00:00.000Z
Resources:
- https://ethos.network
```

## Security Considerations

1. **Nonces**: Each authentication attempt uses a unique, server-generated nonce to prevent replay attacks.

2. **Message Expiration**: SIWE messages include an expiration time. Expired messages are rejected.

3. **Domain Binding**: Messages include the domain and URI to prevent cross-site message reuse.

4. **Server Verification**: Always verify signatures server-side. Never trust client-side verification alone.

## Resources

- [Ethos Network](https://ethos.network) - Create your Ethos profile
- [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) - SIWE standard
- [wagmi](https://wagmi.sh) - React hooks for Ethereum

## License

MIT
