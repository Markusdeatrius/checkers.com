import { SignJWT, jwtVerify } from 'jose';

// Secret jako Uint8Array
const JWT_SECRET = new TextEncoder().encode('supersecret');

export const signJWT = async (payload: object, expiresIn = '1h') => {
  const jwt = await new SignJWT({payload})
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
  return jwt;
};

export const verifyJWT = async (token: string) => {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
};