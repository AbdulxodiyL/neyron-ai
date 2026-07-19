// O'zbekcha kun nomlari
export const DAYS = [
  { id: 'mon', label: 'Du' },
  { id: 'tue', label: 'Se' },
  { id: 'wed', label: 'Ch' },
  { id: 'thu', label: 'Pa' },
  { id: 'fri', label: 'Ju' },
  { id: 'sat', label: 'Sh' },
  { id: 'sun', label: 'Ya' },
];
export const DAYS_FULL = {
  mon: 'Dushanba', tue: 'Seshanba', wed: 'Chorshanba',
  thu: 'Payshanba', fri: 'Juma', sat: 'Shanba', sun: 'Yakshanba',
};

export const parseWeekDays = (raw) => {
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return []; }
};

export const formatSchedule = (group) => {
  const days = parseWeekDays(group?.weekDays);
  const dayLabels = days.map(d => DAYS.find(x => x.id === d)?.label || d).join(', ');
  const time = group?.startTime
    ? `${group.startTime}${group.endTime ? ' – ' + group.endTime : ''}`
    : '';
  const room = group?.room ? group.room : '';
  return [dayLabels, time, room].filter(Boolean).join('  ·  ');
};
