import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import userRoutes from './routes/user';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
}));

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/user', userRoutes);

export default app;