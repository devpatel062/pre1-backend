import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { Question } from '../models/Question.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadQuestions = async () => {
  const data = await fs.readFile(path.join(__dirname, 'questions.json'), 'utf8');
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed)) {
    throw new Error('questions.json must contain exactly 200 questions.');
  }
  return parsed;
};

const run = async () => {
  await mongoose.connect(env.mongoUri);
  const questions = await loadQuestions();
  await Question.deleteMany({});
  await Question.insertMany(questions);
  console.log('Seeded 200 questions from questions.json.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
