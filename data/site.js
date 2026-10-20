// SITE SETTINGS — names, credits and photos used across the site.

export const SITE = {
  name: 'ক্যাম্পাস পথে',
  nameEn: 'Campus Pothe',
  tagline: 'একটু একটু করে, স্বপ্নের ক্যাম্পাসের দিকে।',
  initiative: 'SBS Students’ Association',
  developer: { name: 'Misbahul Tuhin', url: 'https://web.facebook.com/misbahul.tuhin' },
  url: 'https://university-admissions-games-and-qui.vercel.app/',
};

const commons = (file, width = 1280) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
const commonsPage = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

// Header (hero) photo for the home page and the CU page. Three sizes so phones
// download the small one; `placeholder` is a tiny blurred preview shown instantly.
export const CU_HERO = {
  src: 'assets/img/cu-gate-1113.webp',
  srcset: 'assets/img/cu-gate-480.webp 480w, assets/img/cu-gate-768.webp 768w, assets/img/cu-gate-1113.webp 1113w',
  width: 1113,
  height: 635,
  placeholder: 'data:image/webp;base64,UklGRvQAAABXRUJQVlA4IOgAAABwBACdASoYAA4APpE4l0eloyIhMAgAsBIJbACdH8Agoxgq9Xv8/Ml1anHLWAD+0UVx5Vwq3aT4PeVaJCC9DK6bpfEK1obPqn3srMzU7ZaO8s+J4Y4eRIfhwhAXT9XoP9HIag52VveVp+4/HTDGxNV+OM0jYfzWchte9olAtvt83sqyGGUFlYA8hi4v7IrXS0ju1lFpfVYXP42NYbYTH6VaQAdGmnn9NzIz5pV2cbJ5NgBOu6ORpKk2oe/6N3HZNVisX7f/ONiy8gCy/4lHdDAD7OWSQCQ/udRMx8mvpXOCsMkugke4AAAA',
  alt: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের প্রধান ফটক, ওপরে লেখা University of Chittagong',
  caption: 'চবির প্রধান ফটক',
  credit: 'ছবি: সংগৃহীত',
};

// Photos of the University of Chittagong.
// `src` is a local image that always works. `remote` (optional) is a larger
// Wikimedia Commons photo that replaces it once it loads; if it cannot load,
// the local image simply stays. Remote-only items are hidden when they fail.
// Always keep the credit + licence link for Commons photos.
export const CU_PHOTOS = [
  {
    src: 'assets/img/cu-cover.webp',
    remote: commons('Campus, University of Chittagong 1.jpg', 1600),
    alt: 'পাহাড় আর সবুজে ঘেরা চট্টগ্রাম বিশ্ববিদ্যালয় campus',
    caption: 'পাহাড়ঘেরা চবি campus',
    credit: 'Wikimedia Commons',
    creditUrl: commonsPage('Campus, University of Chittagong 1.jpg'),
  },
  {
    src: 'assets/img/cu-buildings.webp',
    alt: 'পাহাড়ের মাঝে চবির academic ও আবাসিক ভবন (illustrative)',
    caption: 'পাহাড়ের কোলে academic ভবন',
    credit: 'Illustrative image',
  },
  {
    remote: commons('Central Shaheed Minar, University of Chittagong (08).jpg'),
    alt: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের কেন্দ্রীয় শহীদ মিনার',
    caption: 'কেন্দ্রীয় শহীদ মিনার',
    credit: 'Moheen Reeyad · Wikimedia Commons',
    creditUrl: commonsPage('Central Shaheed Minar, University of Chittagong (08).jpg'),
  },
  {
    remote: commons('Chittagong University Library (04).jpg'),
    alt: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের কেন্দ্রীয় গ্রন্থাগার',
    caption: 'কেন্দ্রীয় গ্রন্থাগার',
    credit: 'Moheen Reeyad · Wikimedia Commons',
    creditUrl: commonsPage('Chittagong University Library (04).jpg'),
  },
  {
    remote: commons('Chittagong University Road (01).jpg'),
    alt: 'চট্টগ্রাম বিশ্ববিদ্যালয়ের ভেতরের সবুজ রাস্তা',
    caption: 'Campus-এর সবুজ পথ',
    credit: 'Moheen Reeyad · Wikimedia Commons',
    creditUrl: commonsPage('Chittagong University Road (01).jpg'),
  },
  {
    remote: commons('Chittagong University Museum (02).jpg'),
    alt: 'চট্টগ্রাম বিশ্ববিদ্যালয় জাদুঘর',
    caption: 'বিশ্ববিদ্যালয় জাদুঘর',
    credit: 'Moheen Reeyad · Wikimedia Commons',
    creditUrl: commonsPage('Chittagong University Museum (02).jpg'),
  },
];

export const AVATARS = ['🚂', '🦁', '🐯', '🐼', '🦊', '🐸', '🐵', '🦄', '🐧', '🐙', '🐨', '🤖'];
