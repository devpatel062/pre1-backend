import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedValue: { type: Number, required: true, min: 0, max: 5 }
  },
  { _id: false }
);

const areaScoreSchema = new mongoose.Schema(
  {
    coreArea: { type: String, required: true },
    score: { type: Number, required: true }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    answers: { type: [answerSchema], default: [] },
    areaScores: { type: [areaScoreSchema], default: [] },
    totalScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Attempt = mongoose.model('Attempt', attemptSchema);
