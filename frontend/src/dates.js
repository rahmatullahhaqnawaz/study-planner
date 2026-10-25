// Dates are "YYYY-MM-DD" strings in local time (what <input type="date"> uses)
function toISO(d) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso, n) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Monday of the week that contains this date
export function weekStart(iso) {
  const d = fromISO(iso);
  const shift = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - shift);
  return toISO(d);
}

// "2026-10-28" -> "Wed 28 Oct"
export function formatDay(iso) {
  return fromISO(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function weekdayShort(iso) {
  return fromISO(iso).toLocaleDateString("en-GB", { weekday: "short" });
}

export function dayMonth(iso) {
  return fromISO(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Whole days from today until the date (negative = overdue)
export function daysUntil(iso) {
  return Math.round((fromISO(iso) - fromISO(todayISO())) / 86400000);
}

export function dueText(iso) {
  const days = daysUntil(iso);
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}
