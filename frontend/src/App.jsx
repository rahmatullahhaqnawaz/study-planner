import { useEffect, useState } from "react";
import { askAssistant, checkHealth, generatePlan } from "./api";
import { DEFAULT_AVAILABILITY, loadState, saveState } from "./storage";
import { todayISO } from "./dates";
import { setCourses } from "./colors";
import { focusMinutesOn, taskStats } from "./stats";
import useFocusTimer from "./useFocusTimer";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Hero from "./components/Hero";
import StatTiles from "./components/StatTiles";
import ProgressCard from "./components/ProgressCard";
import WeekPlan from "./components/WeekPlan";
import Deadlines from "./components/Deadlines";
import Assistant from "./components/Assistant";
import FocusTimer from "./components/FocusTimer";
import StudyChart from "./components/StudyChart";
import SubjectDonut from "./components/SubjectDonut";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import Settings from "./components/Settings";
import "./App.css";

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState("dashboard");
  const [backend, setBackend] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState("");

  const { tasks, plan, planOutdated, availability, focusLog, name } = state;
  const stats = taskStats(tasks);
  const courses = [...new Set(tasks.map((t) => t.course))];
  setCourses(courses);

  // Save every change in the browser
  useEffect(() => saveState(state), [state]);

  // Check the backend once on start
  useEffect(() => {
    checkHealth().then(() => setBackend("connected")).catch(() => setBackend("offline"));
  }, []);

  const update = (changes) => setState((s) => ({ ...s, ...changes }));

  // ---- Tasks ----
  function addTask(task) {
    setState((s) => ({ ...s, tasks: [...s.tasks, task], planOutdated: true }));
  }
  function deleteTask(id) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id), planOutdated: true }));
  }
  // Ticking a task off keeps the plan: the task just shows as done
  function toggleTask(id) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }

  // ---- Plan ----
  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const result = await generatePlan(tasks, availability);
      update({ plan: result, planOutdated: false });
      setBackend("connected");
    } catch (e) {
      setError(e.message);
      setBackend("offline");
    } finally {
      setLoading(false);
    }
  }

  // ---- Assistant ----
  async function handleAsk(question) {
    setMessages((m) => [...m, { role: "user", text: question }]);
    setAsking(true);
    try {
      const res = await askAssistant(question, tasks);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, source: res.source }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e.message }]);
    } finally {
      setAsking(false);
    }
  }

  // ---- Focus timer ----
  const timer = useFocusTimer((minutes) => {
    const task = tasks.find((t) => t.id === focusTaskId);
    setState((s) => ({
      ...s,
      focusLog: [...s.focusLog, { date: todayISO(), minutes, course: task ? task.course : "General" }],
    }));
  });

  const focusProps = { timer, tasks, focusTaskId, onPickTask: setFocusTaskId };
  const planProps = {
    plan, tasks, outdated: planOutdated, loading, error,
    onGenerate: handleGenerate, onToggle: toggleTask,
  };

  return (
    <div className="shell">
      <Sidebar view={view} onNavigate={setView} />

      <div className="main">
        <Topbar name={name || "Student"} overdue={stats.overdue} backend={backend}
          onAsk={(q) => { setView("assistant"); handleAsk(q); }} />

        {view === "dashboard" && (
          <div className="dash">
            <div className="dash-main">
              <Hero openTasks={tasks.length - stats.completed} loading={loading} hasPlan={!!plan}
                onGenerate={handleGenerate} onAddTask={() => setView("tasks")} />
              <StatTiles stats={stats} />
              <WeekPlan {...planProps} />
              <div className="dash-bottom">
                <FocusTimer {...focusProps} />
                <StudyChart focusLog={focusLog} />
                <SubjectDonut tasks={tasks} />
              </div>
            </div>
            <div className="dash-side">
              <ProgressCard stats={stats} focusMinutes={focusMinutesOn(focusLog)} />
              <Assistant compact messages={messages} loading={asking} onAsk={handleAsk} />
              <Deadlines tasks={tasks} onViewAll={() => setView("tasks")} />
            </div>
          </div>
        )}

        {view === "tasks" && (
          <div className="two-col">
            <TaskForm onAdd={addTask} courses={courses} />
            <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
          </div>
        )}

        {view === "planner" && (
          <div className="stack">
            <WeekPlan {...planProps} />
            <Deadlines tasks={tasks} limit={10} />
          </div>
        )}

        {view === "assistant" && (
          <div className="narrow-col">
            <Assistant messages={messages} loading={asking} onAsk={handleAsk} />
          </div>
        )}

        {view === "analytics" && (
          <div className="stack">
            <StatTiles stats={stats} />
            <div className="three-col">
              <ProgressCard stats={stats} focusMinutes={focusMinutesOn(focusLog)} />
              <StudyChart focusLog={focusLog} />
              <SubjectDonut tasks={tasks} />
            </div>
          </div>
        )}

        {view === "focus" && (
          <div className="narrow-col"><FocusTimer {...focusProps} large /></div>
        )}

        {view === "settings" && (
          <Settings name={name} availability={availability}
            onName={(n) => update({ name: n })}
            onAvailability={(a) => update({ availability: a, planOutdated: !!plan })}
            onReset={() => update({ tasks: [], plan: null, planOutdated: false, focusLog: [], availability: DEFAULT_AVAILABILITY })} />
        )}
      </div>
    </div>
  );
}
