// Colleges students pick from when they register (a college not listed can be typed in).
// n = full name (stored and shown in details), s = short form for the leaderboard,
// p = district. Typing any word — of the name, short form or district — lists every
// college containing it. Add new ones anywhere; order does not matter.

export const COLLEGES = [
  // ---- Chattogram city ----
  { n: 'Chittagong College', s: 'Ctg College', p: 'Chattogram' },
  { n: 'Government Hazi Mohammad Mohsin College', s: 'Mohsin College', p: 'Chattogram' },
  { n: 'Government City College, Chattogram', s: 'City College Ctg', p: 'Chattogram' },
  { n: 'Government Commerce College, Chattogram', s: 'Commerce College Ctg', p: 'Chattogram' },
  { n: 'Chattogram Cantonment Public College', s: 'CCPC', p: 'Chattogram' },
  { n: 'BAF Shaheen College Chattogram', s: 'BAF Shaheen Ctg', p: 'Chattogram' },
  { n: 'Navy Anchorage School and College, Chattogram', s: 'Navy Anchorage', p: 'Chattogram' },
  { n: 'Chattogram Collegiate School and College', s: 'Collegiate Ctg', p: 'Chattogram' },
  { n: 'Ispahani Public School and College', s: 'Ispahani Ctg', p: 'Chattogram' },
  { n: 'Chittagong Cantonment English School and College', s: 'CESC', p: 'Chattogram' },
  { n: 'Bangladesh Mohila Samity Girls\' High School and College', s: 'Mohila Samity', p: 'Chattogram' },
  { n: 'Hazera-Taju Degree College', s: 'Hazera-Taju', p: 'Chattogram' },
  { n: 'Omargani M.E.S. College', s: 'MES College', p: 'Chattogram' },
  { n: 'Agrabad Mohila College', s: 'Agrabad Mohila', p: 'Chattogram' },
  { n: 'Kazem Ali School and College', s: 'Kazem Ali', p: 'Chattogram' },
  { n: 'Chittagong City Corporation Municipal Model School and College', s: 'Municipal Model', p: 'Chattogram' },
  { n: 'Faujdarhat Cadet College', s: 'FCC', p: 'Chattogram' },
  // ---- Chattogram district ----
  { n: 'Patiya Government College', s: 'Patiya Govt', p: 'Chattogram' },
  { n: 'Satkania Government College', s: 'Satkania Govt', p: 'Chattogram' },
  { n: 'Hathazari Government College', s: 'Hathazari Govt', p: 'Chattogram' },
  { n: 'Raozan University College', s: 'Raozan College', p: 'Chattogram' },
  { n: 'Rangunia Government College', s: 'Rangunia Govt', p: 'Chattogram' },
  { n: 'Nizampur Government College, Mirsharai', s: 'Nizampur College', p: 'Chattogram' },
  { n: 'Gachbaria Government College, Chandanaish', s: 'Gachbaria College', p: 'Chattogram' },
  { n: 'Boalkhali Sirajul Islam Government College', s: 'Boalkhali College', p: 'Chattogram' },
  { n: 'Sandwip Government Hazi A.B. College', s: 'Sandwip College', p: 'Chattogram' },
  // ---- Cox's Bazar, Feni, Noakhali, Lakshmipur ----
  { n: 'Cox\'s Bazar Government College', s: 'Cox\'s Bazar Govt', p: 'Cox\'s Bazar' },
  { n: 'Cox\'s Bazar City College', s: 'Cox\'s Bazar City', p: 'Cox\'s Bazar' },
  { n: 'Chakaria Government College', s: 'Chakaria Govt', p: 'Cox\'s Bazar' },
  { n: 'Feni Government College', s: 'Feni Govt', p: 'Feni' },
  { n: 'Feni Girls\' Cadet College', s: 'FGCC', p: 'Feni' },
  { n: 'Noakhali Government College', s: 'Noakhali Govt', p: 'Noakhali' },
  { n: 'Chowmuhani Government S.A. College', s: 'Chowmuhani College', p: 'Noakhali' },
  { n: 'Lakshmipur Government College', s: 'Lakshmipur Govt', p: 'Lakshmipur' },
  // ---- Cumilla, Chandpur, Brahmanbaria ----
  { n: 'Comilla Victoria Government College', s: 'Victoria College', p: 'Cumilla' },
  { n: 'Cumilla Cantonment College', s: 'Cumilla Cantt', p: 'Cumilla' },
  { n: 'Comilla Government Women\'s College', s: 'Cumilla Women\'s', p: 'Cumilla' },
  { n: 'Cumilla Cadet College', s: 'CCC', p: 'Cumilla' },
  { n: 'Chandpur Government College', s: 'Chandpur Govt', p: 'Chandpur' },
  { n: 'Brahmanbaria Government College', s: 'B.Baria Govt', p: 'Brahmanbaria' },
  // ---- Hill districts ----
  { n: 'Rangamati Government College', s: 'Rangamati Govt', p: 'Rangamati' },
  { n: 'Khagrachari Government College', s: 'Khagrachari Govt', p: 'Khagrachari' },
  { n: 'Bandarban Government College', s: 'Bandarban Govt', p: 'Bandarban' },
  // ---- Dhaka ----
  { n: 'Notre Dame College', s: 'NDC', p: 'Dhaka' },
  { n: 'Dhaka College', s: 'Dhaka College', p: 'Dhaka' },
  { n: 'Dhaka Residential Model College', s: 'DRMC', p: 'Dhaka' },
  { n: 'Holy Cross College', s: 'Holy Cross', p: 'Dhaka' },
  { n: 'Viqarunnisa Noon School and College', s: 'VNSC', p: 'Dhaka' },
  { n: 'Rajuk Uttara Model College', s: 'RUMC', p: 'Dhaka' },
  { n: 'Dhaka City College', s: 'Dhaka City', p: 'Dhaka' },
  { n: 'Adamjee Cantonment College', s: 'ACC', p: 'Dhaka' },
  { n: 'Birshreshtha Noor Mohammad Public College', s: 'BNMPC', p: 'Dhaka' },
  { n: 'BAF Shaheen College Dhaka', s: 'BAF Shaheen Dhaka', p: 'Dhaka' },
  { n: 'Dhaka Imperial College', s: 'Imperial College', p: 'Dhaka' },
  { n: 'Government Science College, Dhaka', s: 'Science College', p: 'Dhaka' },
  { n: 'Dhaka Commerce College', s: 'DCC', p: 'Dhaka' },
  { n: 'Shaheed Ramiz Uddin Cantonment College', s: 'SRCC', p: 'Dhaka' },
  { n: 'Milestone College', s: 'Milestone', p: 'Dhaka' },
  { n: 'Saint Joseph Higher Secondary School', s: 'St. Joseph', p: 'Dhaka' },
  { n: 'Ideal School and College', s: 'Ideal', p: 'Dhaka' },
  { n: 'Motijheel Model School and College', s: 'Motijheel Model', p: 'Dhaka' },
  { n: 'Mohammadpur Preparatory School and College', s: 'Mohammadpur Prep', p: 'Dhaka' },
  { n: 'Cambrian School and College', s: 'Cambrian', p: 'Dhaka' },
  { n: 'Tejgaon College', s: 'Tejgaon College', p: 'Dhaka' },
  { n: 'Eden Mohila College', s: 'Eden College', p: 'Dhaka' },
  { n: 'Begum Badrunnesa Government Girls\' College', s: 'Badrunnesa College', p: 'Dhaka' },
  { n: 'Shaheed Bir Uttam Lt. Anwar Girls\' College', s: 'SBULAGC', p: 'Dhaka' },
  { n: 'Bangladesh Navy College Dhaka', s: 'Navy College Dhaka', p: 'Dhaka' },
  { n: 'Dhaka State College', s: 'Dhaka State', p: 'Dhaka' },
  { n: 'Shaheed Police Smrity College', s: 'Police Smrity', p: 'Dhaka' },
  { n: 'Government Bangla College', s: 'Bangla College', p: 'Dhaka' },
  { n: 'Kabi Nazrul Government College', s: 'Kabi Nazrul', p: 'Dhaka' },
  { n: 'Government Shaheed Suhrawardy College', s: 'Suhrawardy College', p: 'Dhaka' },
  { n: 'Monipur High School and College', s: 'Monipur', p: 'Dhaka' },
  { n: 'Dhaka Cantonment Girls\' Public School and College', s: 'DCGPSC', p: 'Dhaka' },
  { n: 'Agrani School and College', s: 'Agrani', p: 'Dhaka' },
  { n: 'Willes Little Flower School and College', s: 'Willes Little Flower', p: 'Dhaka' },
  { n: 'Mirzapur Cadet College', s: 'MCC', p: 'Tangail' },
  // ---- Rajshahi & Rangpur divisions ----
  { n: 'Rajshahi College', s: 'Rajshahi College', p: 'Rajshahi' },
  { n: 'Rajshahi New Government Degree College', s: 'New Govt Rajshahi', p: 'Rajshahi' },
  { n: 'Rajshahi Cantonment Public School and College', s: 'Rajshahi Cantt', p: 'Rajshahi' },
  { n: 'Rajshahi Cadet College', s: 'RCC', p: 'Rajshahi' },
  { n: 'Government Azizul Haque College', s: 'Azizul Haque', p: 'Bogura' },
  { n: 'Pabna Cadet College', s: 'PCC', p: 'Pabna' },
  { n: 'Joypurhat Girls\' Cadet College', s: 'JGCC', p: 'Joypurhat' },
  { n: 'Carmichael College', s: 'Carmichael', p: 'Rangpur' },
  { n: 'Rangpur Cantonment Public School and College', s: 'Rangpur Cantt', p: 'Rangpur' },
  { n: 'Rangpur Cadet College', s: 'RpCC', p: 'Rangpur' },
  // ---- Khulna & Barishal divisions ----
  { n: 'Government Brajalal College', s: 'B.L. College', p: 'Khulna' },
  { n: 'Khulna Public College', s: 'Khulna Public', p: 'Khulna' },
  { n: 'Government Michael Madhusudan College', s: 'M.M. College', p: 'Jashore' },
  { n: 'Jhenaidah Cadet College', s: 'JCC', p: 'Jhenaidah' },
  { n: 'Government Brojomohun College', s: 'B.M. College', p: 'Barishal' },
  { n: 'Barishal Cadet College', s: 'BCC', p: 'Barishal' },
  // ---- Sylhet & Mymensingh divisions ----
  { n: 'Murari Chand College', s: 'M.C. College', p: 'Sylhet' },
  { n: 'Sylhet Government College', s: 'Sylhet Govt', p: 'Sylhet' },
  { n: 'Jalalabad Cantonment Public School and College', s: 'Jalalabad Cantt', p: 'Sylhet' },
  { n: 'Sylhet Cadet College', s: 'SCC', p: 'Sylhet' },
  { n: 'Ananda Mohan College', s: 'A.M. College', p: 'Mymensingh' },
  { n: 'Mymensingh Girls\' Cadet College', s: 'MGCC', p: 'Mymensingh' },
];

/** Leaderboard label: the list's short form, or the name itself when short, or its initials. */
export function collegeShort(full) {
  if (!full) return '';
  const known = COLLEGES.find(c => c.n === full);
  if (known) return known.s;
  if (full.length <= 22) return full;
  return full.split(/[\s,]+/).filter(w => w && !/^(and|of|the|&)$/i.test(w)).map(w => w[0].toUpperCase()).join('');
}

// District names in Bangla, so typing "চট্টগ্রাম" or "ঢাকা" works too.
const PLACE_BN = {
  Chattogram: 'চট্টগ্রাম চট্রগ্রাম Chittagong Ctg', "Cox's Bazar": 'কক্সবাজার', Feni: 'ফেনী', Noakhali: 'নোয়াখালী', Lakshmipur: 'লক্ষ্মীপুর',
  Cumilla: 'কুমিল্লা Comilla', Chandpur: 'চাঁদপুর', Brahmanbaria: 'ব্রাহ্মণবাড়িয়া', Rangamati: 'রাঙ্গামাটি', Khagrachari: 'খাগড়াছড়ি',
  Bandarban: 'বান্দরবান', Dhaka: 'ঢাকা', Tangail: 'টাঙ্গাইল', Rajshahi: 'রাজশাহী', Bogura: 'বগুড়া Bogra', Pabna: 'পাবনা',
  Joypurhat: 'জয়পুরহাট', Rangpur: 'রংপুর', Khulna: 'খুলনা', Jashore: 'যশোর Jessore', Jhenaidah: 'ঝিনাইদহ', Barishal: 'বরিশাল Barisal',
  Sylhet: 'সিলেট', Mymensingh: 'ময়মনসিংহ',
};

/** Every college whose name, short form or district (English or Bangla) contains all typed words. */
export function searchColleges(text, limit = 30) {
  const words = String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return COLLEGES.filter(c => {
    const hay = `${c.n} ${c.s} ${c.p} ${PLACE_BN[c.p] || ''}`.toLowerCase().replace(/[.'’]/g, '');
    return words.every(w => hay.includes(w.replace(/[.'’]/g, '')));
  }).slice(0, limit);
}
