// Save and load everything in the browser, so it survives a refresh.
const KEY = "study-planner-v2";

export const DEFAULT_AVAILABILITY = {
  monday: 3, tuesday: 3, wednesday: 3, thursday: 3, friday: 3,
  saturday: 5, sunday: 5, day_start: 9,
};

const DEFAULT_STATE = {
  tasks: [],
  plan: null,
  planOutdated: false,
  availability: DEFAULT_AVAILABILITY,
  focusLog: [],          // [{ date: "2026-10-25", minutes: 25, course: "OS" }]
  name: "Student",
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.tasks)) {
      return {
        ...DEFAULT_STATE,
        ...saved,
        availability: { ...DEFAULT_AVAILABILITY, ...saved.availability },
      };
    }
    // Bring over tasks from the first version of the app
    const old = JSON.parse(localStorage.getItem("study-planner-v1"));
    if (old && Array.isArray(old.tasks)) return { ...DEFAULT_STATE, tasks: old.tasks };
  } catch {
    // Broken or blocked storage: start fresh
  }
  return DEFAULT_STATE;
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the app still works, it just won't remember
  }
}
