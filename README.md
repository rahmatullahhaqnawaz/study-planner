# Study Planner

Turns your deadlines into a weekly study plan you can actually follow.

Add your study tasks, click one button, and get a time-blocked plan for the week that puts urgent and important work first. It warns you when your workload doesn't fit before a deadline, so you find out on Monday, not the night before.

![Dashboard](screenshots/dashboard.png)

## Features

- **Task management:** add tasks with course, deadline, estimated hours and priority. Mark them done or delete them.
- **Automatic weekly plan:** the scheduler places every task into your free study hours, with real start and end times.
- **Overload warnings:** tasks that can't be finished before their deadline are flagged with how many hours are missing.
- **Progress tracking:** a progress ring, stat tiles and a subject breakdown, all weighted by hours, not task count.
- **Focus mode:** a 25/50-minute focus timer that logs your study time and shows it on a 7-day chart.
- **Study assistant:** breaks down your biggest task, suggests what to do next, and gives revision tips based on your actual tasks. Works offline by default; connects to Claude when an API key is provided.
- **Settings:** your name, daily study hours per weekday, and the hour you start studying.
- **Saved in the browser:** everything survives a page refresh, no account needed.

![Tasks](screenshots/tasks.png)

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React + Vite, lucide-react icons, hand-built SVG charts |
| Backend | Python, FastAPI, Pydantic |
| Testing | pytest (20 tests) |
| Storage | Browser localStorage |
| AI (optional) | Anthropic Messages API |

## How the scheduler works

The planner uses **Earliest Deadline First (EDF)**, a classic greedy scheduling algorithm:

1. Completed tasks are skipped.
2. Tasks whose deadline has already passed are reported as **overdue**.
3. The remaining tasks are sorted by deadline, then by priority (high first).
4. Each task is poured into the free hours of each day, starting today, until it is covered or its deadline is reached.
5. Any hours that don't fit are reported as **at risk**, with the number of hours missing.

The scheduler is a **pure function**: it never reads the clock or a database, so the same input always gives the same plan. That makes it easy to test.

## Architecture

```
React (localhost:5173)                 FastAPI (localhost:8000)
┌──────────────────────┐   POST        ┌──────────────────────────┐
│ Dashboard, Tasks,    │ ────────────▶ │ /api/schedule            │
│ Planner, Focus, ...  │  tasks +      │   └─ scheduler.py (EDF)  │
│                      │  availability │ /api/assistant           │
│ localStorage         │ ◀──────────── │   └─ assistant.py        │
│ (tasks, plan, focus) │   plan / tips │ /api/health              │
└──────────────────────┘               └──────────────────────────┘
```

The backend is **stateless**: it receives tasks, computes a plan, and returns it. All data lives in the browser.

![API docs](screenshots/api-docs.png)

## Run it locally

You need **Python 3.11+** and **Node.js 18+**.

**Backend** (terminal 1):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at http://localhost:8000. Interactive docs are at http://localhost:8000/docs.

**Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

**Tests:**

```bash
cd backend
pytest -q
```

### Optional: real AI answers

Without a key, the assistant gives built-in tips generated from your tasks, and labels them "Offline tips". To get AI answers instead, create `backend/.env`:

```
LLM_API_KEY=your-anthropic-api-key
```

Then run `pip install python-dotenv` and restart the backend. Answers are then labeled "AI answer".

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check the server is running |
| POST | `/api/schedule` | Tasks + availability in, weekly plan + at-risk list out |
| POST | `/api/assistant` | Question + tasks in, answer out |

Invalid input (for example 0 hours or an empty title) returns `422` with the field that failed.

## Design decisions

- **Scheduler first, AI second.** The core app works with no API key. AI is an optional layer on top.
- **Past deadlines are flagged, not rejected.** Tasks are stored in the browser, so a task that was valid yesterday can be overdue today. Rejecting it would break the whole plan request, so the scheduler reports it as overdue instead.
- **Progress counts hours, not tasks.** Finishing an 8-hour essay should move the bar more than a 1-hour quiz.
- **Ticking a task off doesn't reset the plan.** Completed work stays visible, crossed out, so you can see what you got done this week.

## Limitations

- Data is stored per browser. There are no accounts or sync between devices.
- Planning works in whole-hour blocks.
- A task is planned as early as possible; the scheduler doesn't spread work evenly or add breaks between sessions.
- Without an API key, the assistant answers a fixed set of question types.

## Future improvements

- User accounts and a database, so plans sync across devices
- Spread work more evenly and add buffer days before deadlines
- Calendar export (.ics) and deadline reminders
- Upload a syllabus PDF and extract deadlines automatically

## Author

Built by **Rehmat Ullah**, B.Sc. Computer Science (Robotics minor), Constructor University Bremen.

[GitHub](https://github.com/rahmatullahhaqnawaz) · [LinkedIn](https://www.linkedin.com/in/rehmatullah-haqnawaz)