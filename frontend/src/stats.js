import { daysUntil, todayISO } from "./dates";

export function taskStats(tasks) {
  const completed = tasks.filter((t) => t.completed);
  const open = tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => daysUntil(t.deadline) < 0);
  const totalHours = tasks.reduce((s, t) => s + t.est_hours, 0);
  const doneHours = completed.reduce((s, t) => s + t.est_hours, 0);
  return {
    total: tasks.length,
    completed: completed.length,
    inProgress: open.length - overdue.length,
    overdue: overdue.length,
    totalHours,
    doneHours,
    percent: totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100),
  };
}

export function focusMinutesOn(focusLog, iso = todayISO()) {
  return focusLog.filter((f) => f.date === iso).reduce((s, f) => s + f.minutes, 0);
}

// Hours per course, biggest first
export function hoursByCourse(tasks) {
  const map = new Map();
  for (const t of tasks) map.set(t.course, (map.get(t.course) || 0) + t.est_hours);
  return [...map.entries()]
    .map(([course, hours]) => ({ course, hours }))
    .sort((a, b) => b.hours - a.hours);
}
