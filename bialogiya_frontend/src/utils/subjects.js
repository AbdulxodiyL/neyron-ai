export const SUBJECTS = [
  'biology', 'chemistry', 'physics', 'math', 'geography', 'history',
  'literature', 'native_language', 'english', 'russian', 'informatics', 'both', 'other',
];

export const SUBJECT_LABELS = {
  biology: 'Biologiya', chemistry: 'Kimyo', physics: 'Fizika', math: 'Matematika',
  geography: 'Geografiya', history: 'Tarix', literature: 'Adabiyot',
  native_language: 'Ona tili', english: 'Ingliz tili', russian: 'Rus tili',
  informatics: 'Informatika', both: 'Biologiya + Kimyo', other: 'Boshqa',
};

export const getSubjectLabel = (subject) => SUBJECT_LABELS[subject] || subject;
