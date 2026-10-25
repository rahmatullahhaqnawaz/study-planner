import { useState } from "react";
import { Plus } from "lucide-react";
import { todayISO } from "../dates";

const EMPTY = { course: "", title: "", deadline: "", est_hours: "", priority: "2" };

export default function TaskForm({ onAdd, courses }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  }

  // Same rules as the backend, checked before sending
  function validate() {
    const e = {};
    if (!form.course.trim()) e.course = "Enter a course name.";
    if (!form.title.trim()) e.title = "Enter what the task is.";
    if (!form.deadline) e.deadline = "Pick a deadline.";
    else if (form.deadline < todayISO()) e.deadline = "The deadline can't be in the past.";
    const hours = Number(form.est_hours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 100) e.est_hours = "Whole hours, 1 to 100.";
    return e;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) return setErrors(e);
    onAdd({
      id: crypto.randomUUID(),
      course: form.course.trim(),
      title: form.title.trim(),
      deadline: form.deadline,
      est_hours: Number(form.est_hours),
      priority: Number(form.priority),
      completed: false,
    });
    // Keep the course: you often add several tasks for one course
    setForm({ ...EMPTY, course: form.course });
  }

  return (
    <form className="panel task-form" onSubmit={handleSubmit} noValidate>
      <h2>Add a task</h2>

      <div className="field">
        <label htmlFor="course">Course</label>
        <input id="course" list="course-list" value={form.course} placeholder="Operating Systems"
          onChange={(e) => update("course", e.target.value)} />
        <datalist id="course-list">{courses.map((c) => <option key={c} value={c} />)}</datalist>
        {errors.course && <p className="error">{errors.course}</p>}
      </div>

      <div className="field">
        <label htmlFor="title">Task</label>
        <input id="title" value={form.title} placeholder="Exercise sheet 4"
          onChange={(e) => update("title", e.target.value)} />
        {errors.title && <p className="error">{errors.title}</p>}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="deadline">Deadline</label>
          <input id="deadline" type="date" min={todayISO()} value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)} />
          {errors.deadline && <p className="error">{errors.deadline}</p>}
        </div>
        <div className="field narrow">
          <label htmlFor="hours">Hours</label>
          <input id="hours" type="number" min="1" max="100" step="1" value={form.est_hours} placeholder="3"
            onChange={(e) => update("est_hours", e.target.value)} />
          {errors.est_hours && <p className="error">{errors.est_hours}</p>}
        </div>
      </div>

      <div className="field">
        <span className="label">Priority</span>
        <div className="segmented full" role="radiogroup" aria-label="Priority">
          {[["1", "High"], ["2", "Medium"], ["3", "Low"]].map(([v, label]) => (
            <button type="button" key={v} role="radio" aria-checked={form.priority === v}
              className={form.priority === v ? `active p${v}` : ""} onClick={() => update("priority", v)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn gradient"><Plus size={18} /> Add task</button>
    </form>
  );
}
