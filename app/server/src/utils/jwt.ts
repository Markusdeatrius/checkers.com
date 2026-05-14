import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode("supersecret")

export const signJWT = async (
  payload: { userId: string },
  expiresIn = "1h"
) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

export const verifyJWT = async (token: string) => {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as { userId: string }
}