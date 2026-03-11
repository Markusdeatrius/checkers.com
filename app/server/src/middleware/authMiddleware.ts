import { Request, Response, NextFunction } from "express"
import { verifyJWT } from "../utils/jwt"

export const authMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const header = req.headers.authorization

	if (!header) {
		return res.status(401).json({ error: "Missing token" })
	}

	const token = header.split(" ")[1]

	if (!token) {
		return res.status(401).json({ error: "Invalid token format" })
	}

    try {
    const payload = await verifyJWT(token)

    if (!payload || typeof payload.userId !== "number") {
        return res.status(401).json({ error: "Invalid token payload" })
    }

    (req as any).user = payload
    next()
    } catch {
    return res.status(401).json({ error: "Invalid token" })
    }
}