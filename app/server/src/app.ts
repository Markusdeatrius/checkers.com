import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import userRoutes from './routes/user';
import matchRoutes from './routes/match';

const app = express();
app.use(express.json());

// Configure CORS origins via environment variable `CORS_ORIGINS`
// - comma separated list of allowed origins, or `*` to allow all
const rawOrigins = process.env.CORS_ORIGINS || ''
let allowedOrigins: string[] | '*' = ['http://localhost:3000', 'http://localhost:3001']
if (rawOrigins) {
  if (rawOrigins.trim() === '*') allowedOrigins = '*'
  else allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
}

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/user', userRoutes);
app.use('/api/matches', matchRoutes);

export default app;