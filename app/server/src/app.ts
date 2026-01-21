import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
//import authRoutes from "./routes/auth";
//import userRoutes from "./routes/user";
//import gameRoutes from "./routes/game";

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

//app.use("/api/auth", authRoutes);
//app.use("/api/users", userRoutes);
//app.use("/api/game", gameRoutes);

export default app;
