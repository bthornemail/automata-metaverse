# Authentication System

Multi-method authentication system supporting WebAuthn, Ethereum Wallet, and QR Code pairing.

## Features

- ✅ **WebAuthn (FIDO2/Passkeys)** - Passwordless authentication
- ✅ **Ethereum Wallet** - Crypto-native authentication via Ethers.js
- ✅ **QR Code Pairing** - Mobile-friendly device pairing
- ✅ **JWT Sessions** - Secure token-based sessions
- ✅ **Rate Limiting** - DoS protection
- ✅ **Input Validation** - Joi schema validation
- ✅ **CORS Security** - Restricted origins

## Installation

Dependencies are already installed:
- `ethers` - Ethereum wallet support
- `jsonwebtoken` - JWT token management
- `joi` - Input validation
- `qrcode` - QR code generation

## Configuration

Set environment variables:

```bash
# JWT Secret (required)
JWT_SECRET=your-secret-key-here

# Allowed CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://universallifeprotocol.com,https://www.universallifeprotocol.com

# WebAuthn Configuration
WEBAUTHN_RP_ID=universallifeprotocol.com
WEBAUTHN_ORIGIN=https://universallifeprotocol.com
```

## API Endpoints

### WebAuthn Authentication

**Register:**
```bash
# Start registration
POST /api/auth/webauthn/register/start
{
  "userId": "uuid",
  "username": "user@example.com"
}

# Complete registration
POST /api/auth/webauthn/register/complete
{
  "challenge": "challenge-string",
  "credentialId": "credential-id",
  "publicKey": "base64-public-key",
  "attestationObject": "base64-attestation"
}
```

**Login:**
```bash
# Start login
POST /api/auth/webauthn/login/start
{
  "userId": "uuid"
}

# Complete login
POST /api/auth/webauthn/login/complete
{
  "challenge": "challenge-string",
  "credentialId": "credential-id",
  "signature": "base64-signature",
  "authenticatorData": "base64-data"
}
```

### Ethereum Wallet Authentication

```bash
# Get challenge
POST /api/auth/wallet/challenge
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

# Authenticate
POST /api/auth/wallet/login
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign in to Universal Life Protocol..."
}
```

### QR Code Pairing

```bash
# Generate QR code (requires auth)
POST /api/auth/qr/generate
Authorization: Bearer <token>
{
  "deviceId": "device-uuid"
}

# Verify pairing code
POST /api/auth/qr/verify
{
  "code": "123456"
}
```

### Session Management

```bash
# Get current user
GET /api/auth/me
Authorization: Bearer <token>

# Logout
POST /api/auth/logout
Authorization: Bearer <token>
```

## Usage Examples

### Frontend: WebAuthn Registration

```typescript
// Start registration
const response = await fetch('/api/auth/webauthn/register/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    username: user.email,
  }),
});

const { challenge } = await response.json();

// Create credential using WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
    rp: { name: 'Universal Life Protocol' },
    user: {
      id: Uint8Array.from(user.id),
      name: user.email,
      displayName: user.name,
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
  },
});

// Complete registration
await fetch('/api/auth/webauthn/register/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenge,
    credentialId: credential.id,
    publicKey: /* extract from credential */,
    attestationObject: /* extract from credential */,
  }),
});
```

### Frontend: Ethereum Wallet Authentication

```typescript
import { ethers } from 'ethers';

// Get challenge
const challengeRes = await fetch('/api/auth/wallet/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: walletAddress }),
});

const { message } = await challengeRes.json();

// Sign message
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const signature = await signer.signMessage(message);

// Authenticate
const authRes = await fetch('/api/auth/wallet/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: walletAddress,
    signature,
    message,
  }),
});

const { token } = await authRes.json();

// Store token
localStorage.setItem('authToken', token);
```

### Frontend: QR Code Pairing

```typescript
// Generate QR code (after initial auth)
const qrRes = await fetch('/api/auth/qr/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ deviceId: deviceId }),
});

const { qrData } = await qrRes.json();

// Display QR code
import QRCode from 'qrcode';
const qrImage = await QRCode.toDataURL(qrData);

// On mobile device, scan QR code and verify
const verifyRes = await fetch('/api/auth/qr/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: scannedCode }),
});

const { token: mobileToken } = await verifyRes.json();
```

## Security Features

1. **Rate Limiting**
   - Auth endpoints: 5 requests per 15 minutes
   - API endpoints: 100 requests per 15 minutes
   - Strict endpoints: 10 requests per hour

2. **Input Validation**
   - All inputs validated with Joi schemas
   - Prevents injection attacks
   - Type-safe request handling

3. **CORS Protection**
   - Only allows configured origins
   - Credentials support enabled
   - Secure headers via Helmet

4. **Session Security**
   - JWT tokens with expiration
   - Secure secret management
   - Session cleanup

## Android Termux Integration

For remote development from Android Termux:

1. **Use QR Code Pairing**:
   - Generate QR on server
   - Scan with mobile device
   - Get authenticated session

2. **Use Wallet Authentication**:
   - Connect MetaMask or WalletConnect
   - Sign challenge message
   - Authenticate

3. **Use WebAuthn** (if supported):
   - Android 9+ supports WebAuthn
   - Use fingerprint/biometric auth

## Production Considerations

1. **Replace In-Memory Stores**:
   - Use Redis for sessions
   - Use database for credentials
   - Use Redis for rate limiting

2. **Use Proper WebAuthn Library**:
   - Replace simplified WebAuthn with `@simplewebauthn/server`
   - Proper attestation verification
   - Credential management

3. **Add Database**:
   - Store user credentials
   - Store sessions
   - Store pairing codes

4. **Add Monitoring**:
   - Track auth attempts
   - Monitor rate limit hits
   - Log security events

## Testing

```bash
# Test authentication endpoints
curl -X POST http://localhost:3000/api/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

## Next Steps

1. ✅ Implement authentication system
2. ✅ Add rate limiting
3. ✅ Add input validation
4. ✅ Restrict CORS
5. ⏳ Integrate with existing API endpoints
6. ⏳ Add frontend auth UI
7. ⏳ Add database persistence
8. ⏳ Add proper WebAuthn library
