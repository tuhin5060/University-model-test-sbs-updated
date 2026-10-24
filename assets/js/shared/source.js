// The exam a question came from ("CU-B 2022–23", "৩১তম BCS"), shown as a small tag
// beside the question. General labels without a year ("Practice bank", "বিগত বছরের
// Vocabulary"…) name no university or year, so they show nothing.
export const examRef = source => (/[0-9০-৯]/.test(String(source || '')) ? String(source).trim() : '');
