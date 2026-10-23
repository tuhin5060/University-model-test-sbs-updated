// How a student appears to OTHER students (leaderboard, top scorer, popups, community).
// Full name + roll is the sign-in key ("আগে খেলেছি"), so the full name is never shown
// publicly: only the last word of the name and the roll, e.g. "Rahim Uddin" → "Uddin.007".
// A one-word name is shown as it is ("Arman.007"), as the site owner decided.
// Rolls are unique, so the public tag still tells students apart.
// Shared by the server (routes) and the browser (marking your own row).

export const rollText = n => String(n).padStart(3, '0');

export function publicName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return words[words.length - 1] || '?';
}

export const publicTag = (name, roll) => `${publicName(name)}.${rollText(roll)}`;
