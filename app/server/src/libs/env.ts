import dotenv from "dotenv"

dotenv.config()

export const env = {
	PORT: Number(process.env.PORT ?? 5050),
	DATABASE_URL: process.env.DATABASE_URL as string,
	JWT_SECRET: process.env.JWT_SECRET_KEY as string,
}
