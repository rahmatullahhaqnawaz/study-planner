// Each course gets its own color. Courses are sorted by name, so the same
// course keeps the same color, and the first 8 courses never share one.
export const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#eab308", "#ec4899"];

let courseOrder = [];

// Called by App whenever the task list changes
export function setCourses(courses) {
  courseOrder = [...new Set(courses)].sort((a, b) => a.localeCompare(b));
}

export function courseColor(course) {
  let i = courseOrder.indexOf(course);
  if (i === -1) {
    // Unknown course: fall back to a hash of its name
    i = 0;
    for (const ch of course) i = (i * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return PALETTE[i % PALETTE.length];
}
