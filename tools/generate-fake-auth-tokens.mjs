#!/usr/bin/env node
/**
 * Generates fake JWT tokens for Docker testing.
 * These tokens are pre-signed and can be returned by WireMock.
 *
 * Usage: node tools/generate-fake-auth-tokens.mjs
 */

import * as crypto from 'crypto';

// Fixed RSA private key for fake auth (generated once, used consistently)
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPwaEn2oFVswac
aRK/3FlWH0+onKjipkLXBLSNaOxVXfQ0M9tsgz22neL3ZCuChhNlhx+E/PW2r4df
pSOos66C9L0Jm8Izgzwnk2WoZ5hK30WEM+eCYUJKoS7xO2wzVGooVVZd2fhATeqW
/3+XQFzJYwL/Xn3XjuAuomzvH3z2RuufN9/GD/AfSG4Qt7GCmEOy28FI2RQqDTOL
cKOVygnl5wDpVBH9IK5yxjMZdB7Y2Tnh2OfLFgYv7ul4YlxPV83EUsnrfdvCIP8q
IdyckKyfUnnZfVAQHdEh0fUSB+Vul8/nLDH+mrwIAssZs/emPeSJFiycZ2f6KD8Z
t9FZeL55AgMBAAECggEAAuYu9BNLpNO4Gts+V/ImBtUuRi+JzaA4FHp5dLPjK2Wh
nyUI8cyq4hc13VGsUpiWy/QyI4e+UTewbgxhW7eb2XI7R+zAuE8OJM0SOQ1usxRx
SrEI5k6qOggh3huADP8nhutPm++VyXuaM36lK/SfGYTXEX5Nh4I+sjaRn6x1m2qs
vKAXRCfdVOjGZdwIOGu+xmTT61wn81xd+aKIjegFlTQqmxoLLIirGtXbxLIZwOof
LHi820vROpMjJQYd0Pdwt9zACpVoPK3oAsF4HHifwF+0JH3tDO8ur6gnaseH0tXq
uGoTUJcmP9kaIkqtMgrewhMO2UMsXnQ2UM+mVOaLcQKBgQD4iBRor10PWBF/xxai
yijvqcHpvtaoUsyAMKrkNuQi1+vAv+0nIxks0P/MB/a+AyCgRhFTDIh8RjjBmmWq
dSzPo6wbHDfUFli8nMp7rNdC9CaUYUEqGxSj8azVVNwXFtSkqknVivACfnNjTkz9
gXBdp64J3eA4t7T1v/fLl6VYUQKBgQDV/98i5zclAJ2Ei2gwDlJ2/5z3sG5QZ16+
quLOcexPDWYDKzD6h2c8WaukHG6FiQu5RZaqiKSCNddPyuEb32QsW7M5gr22MIqo
s5RebBJphIIYkhLTGr+X6BMwM/dBxC0mdNgUcTRK8hgbBVFDcfwJvG1NAR6zu1qQ
+BEu4T8hqQKBgHn8GMBVKoEIgfZMmqCmRzdzA/mdsLCHi1Z0DLzc8Fbl0hIWYelu
wcGMh7D2S7ZxxIbGPWSc5zTQJrVn+fSTdL4poKTh0ckoer+A2aWgbTuwqGr13U00
Y4ogaet/rlMq4o48AudsPWeL90jLuuBGswdU8QhovdA44vooEhD8yqwxAoGBALg5
F3xSk5RVHUUXRc/o5HDwx84qoiyxcEyvi6SxSf8bx6/+pKFnoyW/BBW5LCPkwKT0
FSoli4lUlFBqlLOL8g6FuppNxMdsrlFglt9aJdeUbPJ9/ZqiMkGxVaNvePGy0jOC
7ulaMuw50Sqhvz1SiOhQv79EsYuERAj8pL44xkJRAoGBAKSH2GmgyWSznmrKssMP
PhHBqZUKm7MPucMVEvhE3zegxpe/pO9mY1hQK8y5zGxflDfKBJWPLNsNof/Tn0IL
/N+MEqyuMFEOGiol8sw3Tw4kWV2WsfVjl9F0dn7q7Gu6fnIvEyGK3SLgYHIetpd2
5wNTevaPlfGnPIDHHyvd7g/9
-----END PRIVATE KEY-----`;

// Base64url encode
function base64url(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create JWT header
function createHeader() {
  return {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'fake-auth-key-1'
  };
}

// Create JWT payload for a user
function createPayload(username, scopes, expiresInDays = 365) {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'http://wiremock:8080/fake-auth',
    sub: username,
    aud: ['reactive-test-api'],
    iat: now,
    exp: now + (expiresInDays * 24 * 60 * 60),
    jti: crypto.randomUUID(),
    scope: scopes
  };
}

// Sign JWT with RSA
function signJwt(header, payload) {
  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(PRIVATE_KEY_PEM);

  return `${signInput}.${base64url(signature)}`;
}

// Generate JWKS public key from private key
function generateJwks() {
  const publicKey = crypto.createPublicKey(PRIVATE_KEY_PEM);
  const jwk = publicKey.export({ format: 'jwk' });

  return {
    keys: [{
      kty: 'RSA',
      kid: 'fake-auth-key-1',
      use: 'sig',
      alg: 'RS256',
      n: jwk.n,
      e: jwk.e
    }]
  };
}

// Test users with different scopes
const TEST_USERS = {
  admin: 'product:read product:write cart:read cart:write checkout:read checkout:write order:read order:write',
  customer: 'product:read cart:read cart:write checkout:write order:read',
  readonly: 'product:read'
};

// Main
const args = process.argv.slice(2);

if (args.includes('--jwks')) {
  // Output just the JWKS
  console.log(JSON.stringify(generateJwks(), null, 2));
} else if (args.includes('--tokens')) {
  // Output tokens as JSON for WireMock
  const tokens = {};
  for (const [username, scopes] of Object.entries(TEST_USERS)) {
    const header = createHeader();
    const payload = createPayload(username, scopes);
    tokens[username] = signJwt(header, payload);
  }
  console.log(JSON.stringify(tokens, null, 2));
} else {
  // Full output
  console.log('=== Fake Auth Token Generator ===\n');

  console.log('JWKS (for wiremock mapping):');
  console.log(JSON.stringify(generateJwks(), null, 2));
  console.log('\n');

  console.log('Test User Tokens (valid for 1 year):');
  console.log('=====================================\n');

  for (const [username, scopes] of Object.entries(TEST_USERS)) {
    const header = createHeader();
    const payload = createPayload(username, scopes);
    const token = signJwt(header, payload);

    console.log(`${username.toUpperCase()}:`);
    console.log(`Scopes: ${scopes}`);
    console.log(`Token: ${token}`);
    console.log('');
  }
}
