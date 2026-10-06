const firstNames = ['Olivia', 'Liam', 'Emma', 'Noah', 'Amelia', 'Elijah', 'Sophia', 'James', 'Charlotte', 'Lucas', 'Isabella', 'Mason', 'Mia', 'Ethan', 'Harper', 'Aiden'];
const lastNames = ['Bennett', 'Carter', 'Wilson', 'Thompson', 'Reynolds', 'Mitchell', 'Anderson', 'Parker'];
export const classes = ['Grade 9 · A', 'Grade 9 · B', 'Grade 10 · A', 'Grade 10 · B', 'Grade 11 · A', 'Grade 12 · A'];
export const today = () => new Date().toLocaleDateString('en-CA');
export function seedStudents() {
  return Array.from({ length: 128 }, (_, i) => ({
    id: `ST-${String(2024001 + i)}`,
    name: `${firstNames[i % 16]} ${lastNames[Math.floor(i / 16)]}`,
    email: `${firstNames[i % 16].toLowerCase()}.${lastNames[Math.floor(i / 16)].toLowerCase()}@student.campus.edu`,
    className: classes[i % classes.length],
    attendance: i % 11 === 6 ? 68 + i % 10 : 90 + i % 11,
    score: i % 11 === 6 ? 48 + i % 18 : 78 + i % 22,
    color: ['peach', 'purple', 'blue', 'green', 'pink'][i % 5],
    joined: '2024-09-02',
    notes: '',
  }));
}
export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('campus-monitor-v1'));
    if (saved && Array.isArray(saved.students) && saved.students.every(s => typeof s.name === 'string' && typeof s.id === 'string' && classes.includes(s.className) && Number.isFinite(s.score) && Number.isFinite(s.attendance))) return { ...saved, attendance: saved.attendance || {}, activities: saved.activities || [] };
  } catch { /* Start with sample data if browser storage is unavailable. */ }
  return { students: seedStudents(), attendance: {}, activities: [], school: 'Westbridge High School' };
}
export const status = s => s.attendance < 80 || s.score < 60 ? 'At risk' : s.score >= 90 ? 'Excellent' : 'On track';
export const average = (list, key) => list.length ? (list.reduce((sum, item) => sum + item[key], 0) / list.length).toFixed(1) : '0.0';

// Merge only this tab's edits into the latest saved snapshot. Independent edits
// from other tabs survive; when both tabs edit one field, the last save wins.
export function mergeState(base, local, latest) {
  const result = structuredClone(latest);
  const baseline = new Map(base.students.map(student => [student.id, student]));
  const current = new Map(result.students.map(student => [student.id, student]));
  for (const student of local.students) {
    const original = baseline.get(student.id);
    if (!original) {
      const added = structuredClone(student);
      result.students.unshift(added);
      current.set(added.id, added);
      continue;
    }
    for (const [key, value] of Object.entries(student)) {
      if (value !== original[key]) {
        if (!current.has(student.id)) {
          const restored = structuredClone(student);
          result.students.push(restored);
          current.set(student.id, restored);
        }
        current.get(student.id)[key] = value;
      }
    }
  }
  for (const [date, entries] of Object.entries(local.attendance)) {
    for (const [id, value] of Object.entries(entries)) {
      if (base.attendance[date]?.[id] !== value) {
        result.attendance[date] ||= {};
        result.attendance[date][id] = value;
      }
    }
  }
  const activityKey = item => JSON.stringify([item.time, item.title, item.detail]);
  const known = new Set([...base.activities, ...latest.activities].map(activityKey));
  const added = local.activities.filter(item => !known.has(activityKey(item)));
  result.activities = [...added, ...latest.activities].sort((a, b) => b.time - a.time).slice(0, 30);
  if (local.school !== base.school) result.school = local.school;
  return result;
}
