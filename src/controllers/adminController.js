import { Attempt } from '../models/Attempt.js';
import { User } from '../models/User.js';

export const dashboard = async (req, res) => {
  const [students, attempts, submitted] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Attempt.countDocuments(),
    Attempt.countDocuments({ status: 'submitted' })
  ]);

  res.json({
    students,
    attempts,
    submitted
  });
};

export const listResults = async (req, res) => {
  const rows = await Attempt.find({ status: 'submitted' })
    .sort({ submittedAt: -1 })
    .populate('student', 'fullName email')
    .select('student areaScores totalScore passed durationSeconds submittedAt');

  const data = rows.map((row) => ({
    attemptId: row._id,
    studentName: row.student?.fullName,
    studentEmail: row.student?.email,
    totalScore: row.totalScore,
    passed: row.passed,
    durationSeconds: row.durationSeconds,
    submittedAt: row.submittedAt,
    areaScores: row.areaScores
  }));

  res.json({ data });
};
