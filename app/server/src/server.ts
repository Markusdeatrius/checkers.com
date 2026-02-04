import express from "express"
import cors from "cors"
import helmet from "helmet"

import { env } from "./libs/env"

import health from "./api/health"
import pub from "./api/public"
import auth from "./api/auth"
import admin from "./api/admin"

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(health)
app.use("/", pub)
app.use("/auth", auth)
app.use("/", admin)

app.listen(env.PORT, () => {
	console.log(`API running on :${env.PORT}`)
})
