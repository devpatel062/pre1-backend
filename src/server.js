import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Ensure DB is connected before handling any request (required for serverless)
let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
      });
    })
    .catch((err) => {
      console.error('Mongo connection failed', err);
      process.exit(1);
    });
}

export default app;
