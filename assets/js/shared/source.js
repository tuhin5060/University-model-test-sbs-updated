// Display an exam reference only when it names a recognizable exam or institution.
// A number alone (e.g. "Practice Set 1") is not evidence of an exam source.
const EXAM = /(?:\b(?:BCS|MBBS|BDS|GST|DU|CU|RU|JU|JnU|CoU|BUP|HSTU|SUST|BUET|KUET|RUET|CUET|CKRUET|IBA|NU|BUTEX|JKKNIU|BSMRSTU|BU|IUT)\b|(?:ঢাবি|চবি|রাবি|জাবি|বিসিএস|গুচ্ছ|মেডিকেল|নার্সিং)|(?:Nursing|University|Unit))/i;
const GENERIC = /^(?:practice|mock|sample|quiz|model test|exercise|worksheet|বিগত বছরের vocabulary|অনুশীলন)/i;
export const examRef = source => {
  const label = String(source ?? '').trim();
  if (!label || GENERIC.test(label) || !/[0-9০-৯]/.test(label)) return '';
  return EXAM.test(label) ? label : '';
};
