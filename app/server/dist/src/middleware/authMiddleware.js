"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "Missing token" });
    }
    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Invalid token format" });
    }
    try {
        const payload = await (0, jwt_1.verifyJWT)(token);
        if (!payload || typeof payload.userId !== "number") {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
