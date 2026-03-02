import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    value: { type: Number, required: true, min: 0, max: 5 }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    coreArea: {
      type: String,
      required: true,
      enum: [
        'Curiosity',
        'Grit + Resilience',
        'Critical Thinking',
        'Attention to Detail',
        'Growth Mindset + Coachability'
      ]
    },
    order: { type: Number, required: true, unique: true },
    options: { type: [optionSchema], required: true }
  },
  { timestamps: true }
);

export const Question = mongoose.model('Question', questionSchema);
