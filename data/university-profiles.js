// Rich profiles for universities that have them (#university/<id>).
// Facts, rankings and photos were checked against the linked sources on the
// date below. Rankings change every year: update `rankings` when a new
// edition is published, and keep `source` for every line.
// Photos load from Wikimedia Commons; keep author + licence with each one.

export const PROFILES_CHECKED = "2026-10-21";

export const PROFILES = {
  du: {
    intro: "১৯২১ সালের ১ জুলাই যাত্রা শুরু করা ঢাকা বিশ্ববিদ্যালয় দেশের সবচেয়ে পরিচিত উচ্চশিক্ষা প্রতিষ্ঠানগুলোর একটি। রাজধানীর রমনা এলাকার এই ক্যাম্পাসে ১৩টি অনুষদ, ৮৩টি বিভাগ ও ১২টি ইনস্টিটিউটে প্রায় ৩৭ হাজার শিক্ষার্থী পড়াশোনা করেন। ১৯৫২ সালের ভাষা আন্দোলন থেকে ১৯৭১ সালের মুক্তিযুদ্ধ পর্যন্ত দেশের ইতিহাসে এই বিশ্ববিদ্যালয়ের শিক্ষক-শিক্ষার্থীদের ভূমিকা অনন্য।",
    admission: "https://admission.eis.du.ac.bd",
    facts: [
      ["প্রতিষ্ঠা", "১ জুলাই ১৯২১", "https://www.du.ac.bd/university/DuataGlance"],
      ["অবস্থান", "রমনা, ঢাকা", "https://www.du.ac.bd/university/DuataGlance"],
      ["ক্যাম্পাসের আয়তন", "২৭৫.০৮৩ একর", "https://www.du.ac.bd/university/DuataGlance"],
      ["অনুষদ", "১৩টি", "https://www.du.ac.bd/university/DuataGlance"],
      ["বিভাগ", "৮৩টি", "https://www.du.ac.bd/university/DuataGlance"],
      ["ইনস্টিটিউট", "১২টি (এছাড়া ৫৬টির বেশি গবেষণা কেন্দ্র)", "https://du.ac.bd/welcome_message"],
      ["শিক্ষার্থী", "প্রায় ৩৭,০০০ (৩৭,০১৮ জন)", "https://www.du.ac.bd/university/DuataGlance"],
      ["শিক্ষক", "১,৯৯২ জন", "https://www.du.ac.bd/university/DuataGlance"],
      ["আবাসিক হল", "২০টি হল ও ৩টি হোস্টেল", "https://www.du.ac.bd/university/DuataGlance"],
      ["মূলমন্ত্র", "শিক্ষাই আলো", "https://en.wikipedia.org/wiki/University_of_Dhaka"],
      ["যাত্রা শুরু", "৩টি অনুষদ, ১২টি বিভাগ, ৬০ জন শিক্ষক, ৮৭৭ জন শিক্ষার্থী ও ৩টি আবাসিক হল নিয়ে; প্রথম উপাচার্য স্যার পি. জে. হার্টগ", "https://www.du.ac.bd/university/DuataGlance"],
      ["ইতিহাসে ভূমিকা", "১৯৪৮ ও ১৯৫২ সালের ভাষা আন্দোলনে কেন্দ্রীয় ভূমিকা; মুক্তিযুদ্ধে বিশ্ববিদ্যালয়ের বহু শিক্ষক, শিক্ষার্থী ও কর্মচারী শহীদ হন", "https://old.du.ac.bd/main_menu/the_university/about"],
    ],
    // Only confirmed results (ranked / not ranked); unconfirmed editions are left out.
    rankings: [
      { name: "QS World University Rankings", edition: "২০২৭", rank: "=৬০০", ranked: true, source: "https://thefinancialexpress.com.bd/education/qs-rankings-2027-du-retains-top-position-in-bd" },
      { name: "QS World University Rankings", edition: "২০২৬", rank: "৫৮৪", ranked: true, source: "https://www.thedailystar.net/campus/education/news/qs-world-university-rankings-2026-where-did-bangladeshi-universities-rank" },
      { name: "QS Asia University Rankings", edition: "২০২৬", rank: "১৩২", ranked: true, source: "https://www.thedailystar.net/campus/education/news/where-did-bangladeshi-universities-rank-2026-qs-asia-university-rankings" },
      { name: "Times Higher Education (THE) World", edition: "২০২৭", rank: "১০০১–১২০০", ranked: true, source: "https://www.timeshighereducation.com/world-university-rankings/university-dhaka" },
      { name: "Times Higher Education (THE) Asia", edition: "২০২৬", rank: "৩০১–৩৫০", ranked: true, source: "https://www.tbsnews.net/bangladesh/education/du-jumps-nearly-100-spots-asia-rankings-2026-emerges-joint-top-bangladesh" },
      { name: "QS — দেশের ভেতরে অবস্থান", edition: "২০২৭", rank: "বাংলাদেশে ১ম", ranked: true, source: "https://www.thedailystar.net/youth/education-0/news/qs-world-university-rankings-2027-where-did-bangladeshi-universities-rank-4201926" },
    ],
    photos: [
      { file: "Curzon Hall, University of Dhaka, Dhaka.jpg", caption: "ঐতিহাসিক কার্জন হল, বিজ্ঞান অনুষদের প্রাণকেন্দ্র", alt: "Red-brick facade of Curzon Hall, home of the Faculty of Science, University of Dhaka", author: "Tanvir Rahat", license: "CC BY-SA 4.0" },
      { file: "Arts Building, DU.JPG", caption: "কলা ভবন, ঢাকা বিশ্ববিদ্যালয়", alt: "Arts Building (Faculty of Arts) of the University of Dhaka", author: "Sufe", license: "CC BY-SA 4.0" },
      { file: "AparajeyoBangla, DU.jpg", caption: "কলা ভবনের সামনে মুক্তিযুদ্ধের ভাস্কর্য অপরাজেয় বাংলা", alt: "Aparajeyo Bangla, the Liberation War sculpture in front of the Arts Building, University of Dhaka", author: "Mashkawat.ahsan", license: "CC BY-SA 4.0" },
      { file: "Anti Terrorism Raju Memorial Sculpture in Dhaka 02.jpg", caption: "টিএসসির পাশে সন্ত্রাসবিরোধী রাজু স্মারক ভাস্কর্য", alt: "Anti-Terrorism Raju Memorial Sculpture near TSC, University of Dhaka", author: "Nahid.rajbd", license: "CC BY-SA 4.0" },
      { file: "Teacher-Student Centre - University of Dhaka Campus - Dhaka 2015-05-31 1955.JPG", caption: "শিক্ষার্থীদের আড্ডার প্রিয় জায়গা টিএসসি (শিক্ষক-ছাত্র কেন্দ্র)", alt: "Teacher-Student Centre (TSC), University of Dhaka", author: "Biswarup Ganguly", license: "CC BY 3.0" },
    ],
  },
  cou: {
    intro: "২০০৬ সালে প্রতিষ্ঠিত কুমিল্লা বিশ্ববিদ্যালয় কুমিল্লার কোটবাড়িতে, লালমাই পাহাড় ও ঐতিহাসিক শালবন বিহারের কাছে অবস্থিত একটি সরকারি বিশ্ববিদ্যালয়। ৬টি অনুষদের ১৯টি বিভাগে এখানে প্রায় সাড়ে ছয় হাজার শিক্ষার্থী পড়াশোনা করেন। সবুজ পাহাড়ি পরিবেশের এই ক্যাম্পাস তুলনামূলক নতুন হলেও দ্রুত বেড়ে উঠছে।",
    admission: "https://www.cou.ac.bd/admission",
    facts: [
      ["প্রতিষ্ঠা", "২৮ মে ২০০৬", "https://www.cou.ac.bd/q/university-at-a-glance"],
      ["অবস্থান", "কোটবাড়ি (শালবন বিহার, ময়নামতি), কুমিল্লা", "https://www.cou.ac.bd/q/historical-outline"],
      ["ক্যাম্পাসের আয়তন", "মোট ২৪৪.১৯ একর (সালমানপুরে ৫০ একর ও রাজারখোলায় ১৯৪.১৯ একর)", "https://en.wikipedia.org/wiki/Comilla_University"],
      ["অনুষদ", "৬টি", "https://www.cou.ac.bd/q/university-at-a-glance"],
      ["বিভাগ", "১৯টি", "https://www.cou.ac.bd/q/university-at-a-glance"],
      ["শিক্ষার্থী", "প্রায় ৬,৫০০ (৬,৪৬১ জন)", "https://www.cou.ac.bd/q/university-at-a-glance"],
      ["আবাসিক হল", "৫টি (ছাত্রদের ৩টি, ছাত্রীদের ২টি)", "https://bn.banglapedia.org/index.php?title=%E0%A6%95%E0%A7%81%E0%A6%AE%E0%A6%BF%E0%A6%B2%E0%A7%8D%E0%A6%B2%E0%A6%BE_%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%8D%E0%A6%AC%E0%A6%AC%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A6%AF%E0%A6%BC"],
      ["যাত্রা শুরু", "৩০০ জন শিক্ষার্থী, ১৫ জন শিক্ষক ও ৭টি বিভাগ নিয়ে", "https://en.banglapedia.org/index.php/Comilla_University"],
    ],
    // Only confirmed results (ranked / not ranked); unconfirmed editions are left out.
    rankings: [
      { name: "QS World University Rankings", edition: "২০২৭", rank: "তালিকায় নেই", ranked: false, source: "https://www.thedailystar.net/youth/education-0/news/qs-world-university-rankings-2027-where-did-bangladeshi-universities-rank-4201926" },
      { name: "Times Higher Education (THE) World", edition: "২০২৭", rank: "তালিকায় নেই", ranked: false, source: "https://dailybanglapost.com/campus/63444" },
    ],
    photos: [
      { file: "Comilla University campus.jpg", caption: "কুমিল্লা বিশ্ববিদ্যালয়ের প্রশাসনিক ভবন", alt: "Administrative building of Comilla University, Kotbari, Cumilla", author: "Kamrul Islam Shahin (কামরুল ইসলাম শাহীন)", license: "CC BY-SA 4.0" },
      { file: "Comilla University campus building.jpg", caption: "কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাসের একটি ভবন", alt: "Campus building of Comilla University", author: "Kamrul Islam Shahin (কামরুল ইসলাম শাহীন)", license: "CC BY-SA 4.0" },
      { file: "Mosque, comilla university .jpg", caption: "কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাসের মসজিদ", alt: "Mosque on the Comilla University campus", author: "Ferdous", license: "CC BY-SA 3.0" },
    ],
  },
};
