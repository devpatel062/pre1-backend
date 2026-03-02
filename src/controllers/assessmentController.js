import { Attempt } from '../models/Attempt.js';
import { Question } from '../models/Question.js';
import { calculateScores } from '../services/scoringService.js';
import { TEST_DURATION_SECONDS } from '../utils/constants.js';

const getRemainingSeconds = (attempt) => {
  const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  return Math.max(TEST_DURATION_SECONDS - elapsed, 0);
};

export const checkStatus = async (req, res) => {
  const completed = await Attempt.findOne(
    { student: req.user._id, status: { $in: ['submitted', 'expired'] } }
  );
  if (completed) {
    return res.json({ alreadyAttempted: true, attemptId: completed._id });
  }
  const inProgress = await Attempt.findOne({ student: req.user._id, status: 'in_progress' });
  if (inProgress) {
    return res.json({ alreadyAttempted: false, inProgress: true });
  }
  return res.json({ alreadyAttempted: false, inProgress: false });
};

export const startAssessment = async (req, res) => {
  // Prevent users who have already completed the assessment from starting again
  const completed = await Attempt.findOne(
    { student: req.user._id, status: { $in: ['submitted', 'expired'] } }
  );
  if (completed) {
    return res.status(403).json({
      message: 'You have already completed the assessment. Each account is limited to one attempt.',
      attemptId: completed._id
    });
  }

  const existing = await Attempt.findOne({ student: req.user._id, status: 'in_progress' });
  if (existing) {
    const remainingSeconds = getRemainingSeconds(existing);
    return res.json({ attemptId: existing._id, remainingSeconds });
  }

  const questions = await Question.find({}).sort({ order: 1 }).select('_id');
  if (!questions.length) {
    return res.status(400).json({ message: 'No questions found. Seed questions first.' });
  }

  const attempt = await Attempt.create({
    student: req.user._id,
    startedAt: new Date(),
    questionIds: questions.map((q) => q._id)
  });

  res.status(201).json({ attemptId: attempt._id, remainingSeconds: TEST_DURATION_SECONDS });
};

export const getAttemptPage = async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = 1;

  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id });
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ message: 'Attempt is not active' });

  const remainingSeconds = getRemainingSeconds(attempt);
  if (remainingSeconds <= 0) {
    attempt.status = 'expired';
    attempt.submittedAt = new Date();
    attempt.durationSeconds = TEST_DURATION_SECONDS;
    await attempt.save();
    return res.status(410).json({ message: 'Assessment time expired' });
  }

  const totalQuestions = attempt.questionIds.length;
  const totalPages = Math.ceil(totalQuestions / pageSize);
  if (page < 1 || page > totalPages) {
    return res.status(400).json({ message: 'Invalid page' });
  }

  const idx = page - 1;
  const questionId = attempt.questionIds[idx];
  const question = await Question.findById(questionId).select('prompt coreArea options order');

  const existingAnswer = attempt.answers.find((a) => String(a.question) === String(questionId));

  res.json({
    attemptId: attempt._id,
    page,
    totalPages,
    totalQuestions,
    remainingSeconds,
    question,
    selectedValue: existingAnswer?.selectedValue ?? null
  });
};

export const saveAnswer = async (req, res) => {
  const { questionId, selectedValue } = req.body;

  if (typeof selectedValue !== 'number') {
    return res.status(400).json({ message: 'selectedValue must be a number' });
  }

  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id });
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ message: 'Attempt is not active' });

  const allowed = attempt.questionIds.some((id) => String(id) === String(questionId));
  if (!allowed) return res.status(400).json({ message: 'Question not part of this attempt' });

  const idx = attempt.answers.findIndex((a) => String(a.question) === String(questionId));
  if (idx >= 0) {
    attempt.answers[idx].selectedValue = selectedValue;
  } else {
    attempt.answers.push({ question: questionId, selectedValue });
  }

  await attempt.save();
  res.json({ message: 'Answer saved' });
};

export const submitAssessment = async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id });
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ message: 'Attempt is not active' });

  const questions = await Question.find({ _id: { $in: attempt.questionIds } });

  const now = new Date();
  const elapsed = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000);
  if (elapsed > TEST_DURATION_SECONDS) {
    attempt.status = 'expired';
    attempt.submittedAt = now;
    attempt.durationSeconds = TEST_DURATION_SECONDS;
    await attempt.save();
    return res.status(410).json({ message: 'Assessment time expired' });
  }

  attempt.durationSeconds = Math.min(elapsed, TEST_DURATION_SECONDS);
  attempt.submittedAt = now;

  const { areaScores, totalScore, passed } = calculateScores({
    questions,
    answers: attempt.answers
  });

  attempt.areaScores = areaScores;
  attempt.totalScore = totalScore;
  attempt.passed = passed;
  attempt.status = 'submitted';
  await attempt.save();

  res.json({ attemptId: attempt._id });
};

export const getResult = async (req, res) => {
  const attempt = await Attempt.findOne({ _id: req.params.attemptId, student: req.user._id }).populate(
    'student',
    'fullName email'
  );

  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'submitted') return res.status(400).json({ message: 'Result unavailable' });

  const hours = Math.floor(attempt.durationSeconds / 3600);
  const minutes = Math.floor((attempt.durationSeconds % 3600) / 60);

  res.json({
    student: {
      fullName: attempt.student.fullName,
      email: attempt.student.email
    },
    attemptId: attempt._id,
    passed: attempt.passed,
    totalScore: attempt.totalScore,
    areaScores: attempt.areaScores,
    duration: { hours, minutes }
  });
};
