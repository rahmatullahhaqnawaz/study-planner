"""The study assistant.

Two modes:
  - "ai":      if LLM_API_KEY is set, the question goes to Claude via the
               Anthropic Messages API.
  - "offline": no key (or the API fails) -> built-in tips generated from your
               tasks. The app never depends on an API key.
"""

import os
from datetime import date

import httpx

from models import AssistantResponse, Task

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = "claude-haiku-5-5"


def answer(question: str, tasks: list[Task], today: date) -> AssistantResponse:
    api_key = os.getenv("LLM_API_KEY", "").strip()
    if api_key:
        try:
            text = _ask_claude(question, tasks, today, api_key)
            return AssistantResponse(answer=text, source="ai")
        except Exception:
            pass  # fall through to offline tips
    return AssistantResponse(answer=offline_answer(question, tasks, today), source="offline")


# ---------- AI mode ----------

def _task_summary(tasks: list[Task], today: date) -> str:
    open_tasks = [t for t in tasks if not t.completed]
    if not open_tasks:
        return "The student has no open tasks."
    lines = []
    for t in sorted(open_tasks, key=lambda t: t.deadline):
        days = (t.deadline - today).days
        lines.append(f"- {t.course}: {t.title}, {t.est_hours}h, due {t.deadline} "
                     f"({days} days), priority {t.priority}")
    return "Open tasks:\n" + "\n".join(lines)


def _ask_claude(question: str, tasks: list[Task], today: date, api_key: str) -> str:
    system = (
        "You are a concise study coach inside a study planner app. "
        f"Today is {today}. {_task_summary(tasks, today)} "
        "Answer in under 150 words. Use short bullet points when listing steps."
    )
    response = httpx.post(
        ANTHROPIC_URL,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": os.getenv("LLM_MODEL", DEFAULT_MODEL),
            "max_tokens": 400,
            "system": system,
            "messages": [{"role": "user", "content": question}],
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()["content"][0]["text"]


# ---------- Offline mode ----------

def _break_down(task: Task) -> str:
    """Split a task into 1-2 hour sessions with a clear goal for each."""
    hours = task.est_hours
    sessions = []
    while hours > 0:
        size = 2 if hours >= 2 else 1
        sessions.append(size)
        hours -= size
    steps = ["Read the brief and list what's required",
             "Do the core work",
             "Keep going on the core work",
             "Review, fix gaps and finish"]
    lines = []
    for i, size in enumerate(sessions):
        if i == 0:
            goal = steps[0]
        elif i == len(sessions) - 1:
            goal = steps[3]
        else:
            goal = steps[1] if i == 1 else steps[2]
        lines.append(f"{i + 1}. {size}h: {goal}")
    return f"Break down \"{task.title}\" ({task.course}, {task.est_hours}h):\n" + "\n".join(lines)


def offline_answer(question: str, tasks: list[Task], today: date) -> str:
    q = question.lower()
    open_tasks = sorted([t for t in tasks if not t.completed],
                        key=lambda t: (t.deadline, t.priority))

    if any(word in q for word in ["break", "split", "steps"]):
        if not open_tasks:
            return "Add a task first, then I can break it into study sessions."
        biggest = max(open_tasks, key=lambda t: t.est_hours)
        return _break_down(biggest)

    if any(word in q for word in ["plan", "exam", "prepare", "schedule"]):
        if not open_tasks:
            return "You have no open tasks. Add your exams and assignments to get a plan."
        first = open_tasks[0]
        total = sum(t.est_hours for t in open_tasks)
        days = (first.deadline - today).days
        when = "today" if days <= 0 else f"in {days} day{'s' if days != 1 else ''}"
        return (f"You have {len(open_tasks)} open task(s), {total}h in total.\n"
                f"Start with \"{first.title}\" ({first.course}), due {when}.\n"
                "Then click Generate plan: it schedules everything by deadline and priority, "
                "and warns you if something doesn't fit.")

    if any(word in q for word in ["revision", "revise", "tips", "memor", "focus"]):
        return ("Revision tips:\n"
                "- Use 25-minute focus sessions with 5-minute breaks.\n"
                "- Test yourself before re-reading: old exams, flashcards.\n"
                "- Revisit each topic after 1 day, 3 days and 1 week.\n"
                "- Explain the topic out loud as if teaching a friend.")

    if any(word in q for word in ["next", "now", "today", "what should"]):
        if not open_tasks:
            return "Nothing open. Good moment to review notes or rest."
        first = open_tasks[0]
        return f"Work on \"{first.title}\" ({first.course}) next. It has the earliest deadline."

    return ("I'm in offline mode, so I can help with: making a study plan, breaking down "
            "a task, revision tips, and what to do next. Add an LLM_API_KEY to the backend "
            "to ask anything.")
