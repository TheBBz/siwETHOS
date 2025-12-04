# @signinwithethos/providers

SIWE (Sign-In with Ethereum) authentication utilities for Sign in with Ethos.

This package is primarily used internally by the Sign in with Ethos server. For client-side integration, use [`@signinwithethos/js`](https://www.npmjs.com/package/@signinwithethos/js).

## Installation

```bash
npm install @signinwithethos/providers
```

## Features

- SIWE message creation and parsing (EIP-4361)
- Signature verification
- Nonce generation and validation
- Address checksum utilities

## Usage

```typescript
import {
  createSIWEMessage,
  formatSIWEMessage,
  verifySIWEMessage,
  generateNonce,
} from '@signinwithethos/providers';

// Create a SIWE message
const message = createSIWEMessage({
  domain: 'example.com',
  address: '0x1234...5678',
  uri: 'https://example.com',
  nonce: generateNonce(),
  chainId: 1,
});

// Format for signing
const messageString = formatSIWEMessage(message);

// Verify a signed message
const result = await verifySIWEMessage({
  message: messageString,
  signature: '0x...',
  address: '0x1234...5678',
});
```

## API

### Message Functions

- `createSIWEMessage(params)` - Create a SIWE message object
- `formatSIWEMessage(message)` - Format message for wallet signing
- `parseSIWEMessage(messageString)` - Parse a formatted message

### Verification

- `verifySIWEMessage(params)` - Verify a signed SIWE message

### Nonce

- `generateNonce()` - Generate a cryptographic nonce
- `createNonceStore(options)` - Create a nonce store for validation

### Address Utilities

- `checksumAddress(address)` - Convert to EIP-55 checksum format
- `isValidAddress(address)` - Validate Ethereum address

## Related

- [@signinwithethos/js](https://www.npmjs.com/package/@signinwithethos/js) - Client SDK
- [Sign in with Ethos](https://github.com/thebbz/signinwithethos) - Full project

## License

MIT
