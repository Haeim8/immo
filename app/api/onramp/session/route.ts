import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME || '';
const CDP_API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY || '';

function base64UrlEncode(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateNonce(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function generateJWT(): Promise<string> {
  const keyId = CDP_API_KEY_NAME;
  const privateKeyBase64 = CDP_API_KEY_PRIVATE_KEY;

  // Decode Ed25519 key (64 bytes: 32 seed + 32 public)
  const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
  const seed = privateKeyBytes.subarray(0, 32);

  // Build PKCS#8 for Ed25519
  const pkcs8Header = Buffer.from('302e020100300506032b657004220420', 'hex');
  const pkcs8Der = Buffer.concat([pkcs8Header, seed]);

  const privateKey = crypto.createPrivateKey({
    key: pkcs8Der,
    format: 'der',
    type: 'pkcs8'
  });

  // JWT Header (EdDSA)
  const header = {
    alg: 'EdDSA',
    typ: 'JWT',
    kid: keyId,
    nonce: generateNonce(16)
  };

  // JWT Payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: keyId,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120,
    uri: 'POST api.developer.coinbase.com/onramp/v1/token'
  };

  // Encode and sign
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto.sign(null, Buffer.from(message), privateKey);
  const signatureB64 = base64UrlEncode(signature);

  return `${message}.${signatureB64}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, blockchains = ['base'] } = body;

    if (!CDP_API_KEY_NAME || !CDP_API_KEY_PRIVATE_KEY) {
      console.error('CDP credentials missing');
      return NextResponse.json(
        { error: 'CDP API credentials not configured' },
        { status: 500 }
      );
    }

    const jwt = await generateJWT();

    // Get client IP (only use if it's a public IP)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim();

    // Check if IP is public (not localhost/private)
    const isPublicIp = clientIp &&
      !clientIp.startsWith('127.') &&
      !clientIp.startsWith('192.168.') &&
      !clientIp.startsWith('10.') &&
      !clientIp.startsWith('172.') &&
      clientIp !== '::1';

    const requestBody: Record<string, unknown> = {
      addresses: address ? [{ address, blockchains }] : [],
      assets: ['USDC'],
    };

    // Only include clientIp if it's a public IP
    if (isPublicIp && clientIp) {
      requestBody.clientIp = clientIp;
    }

    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Coinbase response status:', response.status);
    console.log('Coinbase response:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate session token', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Session token error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
