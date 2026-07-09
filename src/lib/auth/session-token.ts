import { getAuthSecret } from "./config";

export type SessionPayload = {
  userId: number;
  username: string;
  fullName?: string;
  role: string;
  exp: number;
};

const encoder = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const data = JSON.stringify(payload);
  const dataPart = toBase64Url(encoder.encode(data));
  const key = await importKey(getAuthSecret());
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataPart));
  return `${dataPart}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const dot = token.indexOf(".");
  if (dot === -1) return null;

  const dataPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  if (!dataPart || !sigPart) return null;

  try {
    const key = await importKey(getAuthSecret());
    const signatureBytes = new Uint8Array(fromBase64Url(sigPart));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(dataPart)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(dataPart))) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.userId || !payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}
