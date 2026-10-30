// Conjunction — 9 questions.
// To add a question, copy one { … } block, paste it at the end of the list and edit it.
// answer: "A" | "B" | "C" | "D". explainBn / units are optional. See CONTENT_GUIDE.md.
export default {
  id: "conjunction",
  title: "Conjunction",
  bn: "because / because of, no sooner … than",
  icon: "🔗",
  color: "#a16207",
  tipBn: "noun বা phrase-এর আগে because of / due to, পুরো clause-এর আগে because; No sooner … than, Hardly / Scarcely … when।",
  questions: [
    {
      q: "The concert was postponed ____ the heavy rain.",
      options: ["because","since of","although of","because of"],
      answer: "D",
      explainBn: "noun phrase-এর আগে because of: because of the heavy rain। তাই because, since of, although of এখানে ভুল।",
    },
    {
      q: "The match was postponed ____ it was raining heavily.",
      options: ["because","because of","due to","despite of"],
      answer: "A",
      explainBn: "subject + verb (clause)-এর আগে because। তাই because of, due to, despite of এখানে ভুল।",
    },
    {
      q: "The train was late ____ a signal failure.",
      options: ["since","due to","because","although"],
      answer: "B",
      explainBn: "noun phrase-এর আগে due to: due to a signal failure। তাই since, because, although এখানে ভুল।",
    },
    {
      q: "She stayed home ____ she was feeling unwell.",
      options: ["despite","due to","because","because of"],
      answer: "C",
      explainBn: "clause (she was feeling…)-এর আগে because। তাই despite, due to, because of এখানে ভুল।",
    },
    {
      q: "The roads were closed ____ flooding.",
      options: ["because","although","so that","because of"],
      answer: "D",
      explainBn: "noun (flooding)-এর আগে because of। তাই because, although, so that এখানে ভুল।",
    },
    {
      q: "No sooner had she sat down ____ the lights went out.",
      options: ["that","than","when","then"],
      answer: "B",
      explainBn: "No sooner-এর সাথে than বসে। তাই that, when, then এখানে ভুল।",
    },
    {
      q: "Hardly had we reached home ____ the storm began.",
      options: ["that","as","when","than"],
      answer: "C",
      explainBn: "Hardly-এর সাথে when বসে। তাই that, as, than এখানে ভুল।",
    },
    {
      q: "No sooner ____ he completed the report than he sent it.",
      options: ["has","does","was","had"],
      answer: "D",
      explainBn: "No sooner had + subject + V3 … than। তাই has, does, was এখানে ভুল।",
    },
    {
      q: "Scarcely had the meeting started ____ the alarm sounded.",
      options: ["when","than","that","until"],
      answer: "A",
      explainBn: "Scarcely-এর সাথে when বসে। তাই than, that, until এখানে ভুল।",
    },
  ],
};
