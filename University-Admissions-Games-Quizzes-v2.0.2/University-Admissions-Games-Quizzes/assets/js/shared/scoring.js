// Shared scoring rules. Imported by the browser (live score) AND by api/scores.js
// (authoritative score), so both always agree. Keep this file dependency-free.

export const MODES = ['fun', 'exam', 'practice'];
export const MAX_QUESTIONS = 50;
export const FUN_SECONDS = [20, 30];
export const EXAM_PACE = { admission: 36, relaxed: 60 }; // seconds per question
export const NEGATIVE_MARKS = [0, 0.25];

/** Streak multiplier after a correct answer. */
export function multiplier(streak) {
  return streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
}

/** Fun mode points for one correct answer. `secondsLeft` is clamped to the limit. */
export function funPoints(streak, secondsLeft, limit = 30) {
  const left = Math.max(0, Math.min(limit, Number(secondsLeft) || 0));
  return Math.round((10 + Math.ceil(left / 3)) * multiplier(streak));
}

/** Highest possible fun score for n questions (used for sanity limits). */
export function maxFunScore(n, limit = 30) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += funPoints(i, limit, limit);
  return total;
}

/**
 * Score one attempt.
 * @param {object} attempt { mode, settings:{perQuestion, negative}, answers:[{id, choice, sec, frozen}] }
 * @param {Map} questionMap id -> question ({a: correct index})
 * @returns {{correct, wrong, skipped, total, score, marks, bestStreak, points:Object}}
 */
export function scoreAttempt(attempt, questionMap) {
  const mode = MODES.includes(attempt.mode) ? attempt.mode : 'exam';
  const limit = FUN_SECONDS.includes(Number(attempt.settings?.perQuestion)) ? Number(attempt.settings.perQuestion) : 30;
  const negative = NEGATIVE_MARKS.includes(Number(attempt.settings?.negative)) ? Number(attempt.settings.negative) : 0;
  let correct = 0, wrong = 0, skipped = 0, streak = 0, bestStreak = 0, funScore = 0;
  const points = {};
  for (const ans of attempt.answers || []) {
    const q = questionMap.get(ans.id);
    if (!q) continue;
    const choice = Number.isInteger(ans.choice) ? ans.choice : -1;
    if (choice < 0) { skipped++; streak = 0; continue; }
    if (choice === q.a) {
      correct++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      if (mode === 'fun') {
        const left = ans.frozen ? limit : limit - (Number(ans.sec) || 0);
        points[ans.id] = funPoints(streak, left, limit);
        funScore += points[ans.id];
      }
    } else {
      wrong++;
      streak = 0;
    }
  }
  const total = correct + wrong + skipped;
  const marks = Math.max(0, correct - wrong * negative);
  const percent = total ? Math.round((marks / total) * 1000) / 10 : 0;
  return {
    correct,
    wrong,
    skipped,
    total,
    marks: Math.round(marks * 100) / 100,
    percent,
    bestStreak,
    points,
    score: mode === 'fun' ? funScore : percent,
  };
}
