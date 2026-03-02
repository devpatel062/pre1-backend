import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ['student', 'admin', 'superuser'],
      default: 'student'
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
