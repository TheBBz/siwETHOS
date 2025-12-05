# Security Policy

## Supported Versions

We release security patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Sign in with Ethos seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via x/twitter to:

📧 **@thebbz**

Please include the following information in your report:

- **Type of vulnerability** (e.g., authentication bypass, injection, XSS, etc.)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** and how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within **48 hours**.
- **Communication**: We will keep you informed about our progress as we work to address the issue.
- **Resolution**: We aim to resolve critical vulnerabilities within **7 days** and non-critical ones within **30 days**.
- **Credit**: If you would like, we will publicly credit you for the discovery once the vulnerability is fixed.

### Safe Harbor

We consider security research conducted in good faith to be protected activity. We will not take legal action against researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, or service interruption
- Only interact with accounts they own or have explicit permission to test
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
- Report the vulnerability promptly and do not disclose it publicly until we've had a chance to address it

## Security Best Practices

When deploying Sign in with Ethos, we recommend:

1. **Keep dependencies updated**: Regularly run `pnpm update` to get security patches
2. **Use HTTPS**: Always deploy behind HTTPS in production
3. **Secure environment variables**: Never commit secrets to version control
4. **Short nonce expiry**: Keep SIWE nonce expiry short (default 5 minutes) to prevent replay attacks
5. **Monitor logs**: Watch for unusual authentication patterns

## Security Features

Sign in with Ethos includes several security features:

- **SIWE (Sign-In with Ethereum)**: Cryptographic wallet-based authentication following EIP-4361
- **Nonce-based replay protection**: Each authentication request uses a unique, short-lived nonce
- **Message expiration**: SIWE messages expire after a configurable time (default 5 minutes)
- **Domain binding**: Messages are bound to specific domains to prevent phishing attacks

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release patched versions as soon as possible
5. Publish a security advisory with details

Thank you for helping keep Sign in with Ethos and our users safe!
