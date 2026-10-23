// How a student appears to OTHER students (leaderboard, top scorer, popups, community).
// Full name + roll is the sign-in key ("আগে খেলেছি"), so the full name is never shown
// publicly: only the last word of the name and the roll, e.g. "Rahim Uddin" → "Uddin.007".
// A one-word name would be the whole key, so only its first letter is shown ("R•••.007").
// Rolls are unique, so the public tag still tells students apart.
// Shared by the server (routes) and the browser (marking your own row).

export const rollText = n => String(n).padStart(3, '0');

export function publicName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return words[words.length - 1];
  const first = Array.from(words[0] || '?')[0];
  return `${first}•••`;
}

export const publicTag = (name, roll) => `${publicName(name)}.${rollText(roll)}`;
