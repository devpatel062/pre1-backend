import { CORE_AREAS, PASSING_PERCENTAGE } from '../utils/constants.js';

export const calculateScores = ({ questions, answers }) => {
  const byQuestion = new Map(questions.map((q) => [String(q._id), q]));

  const areaRaw = new Map(CORE_AREAS.map((area) => [area, { achieved: 0, max: 0 }]));

  questions.forEach((q) => {
    const max = Math.max(...q.options.map((o) => o.value));
    areaRaw.get(q.coreArea).max += max;
  });

  answers.forEach((answer) => {
    const q = byQuestion.get(String(answer.question));
    if (!q) return;
    areaRaw.get(q.coreArea).achieved += answer.selectedValue;
  });

  const areaScores = CORE_AREAS.map((area) => {
    const { achieved, max } = areaRaw.get(area);
    const percentage = max > 0 ? Math.round((achieved / max) * 100) : 0;
    return { coreArea: area, score: percentage };
  });

  const totalScore = Math.round(
    areaScores.reduce((sum, area) => sum + area.score, 0) / areaScores.length
  );

  return {
    areaScores,
    totalScore,
    passed: totalScore >= PASSING_PERCENTAGE
  };
};
