"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.signJWT = void 0;
const jose_1 = require("jose");
const JWT_SECRET = new TextEncoder().encode("supersecret");
const signJWT = async (payload, expiresIn = "1h") => {
    return await new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(expiresIn)
        .sign(JWT_SECRET);
};
exports.signJWT = signJWT;
const verifyJWT = async (token) => {
    const { payload } = await (0, jose_1.jwtVerify)(token, JWT_SECRET);
    return payload;
};
exports.verifyJWT = verifyJWT;
