import { PrismaClient } from "@prisma/client"
import app from "./app"

const prisma = new PrismaClient()


app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

app.post("/users", async (req, res) => {
  const { email, name, password } = req.body

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password
    }
  })

  res.json(user)
})

const port = 3000

app.listen(port, () => {
  console.log(`server running on port ${port}`)
})