"""The study assistant.

Three modes, picked by which key is in backend/.env:
  - GEMINI_API_KEY -> Google Gemini (free tier, no credit card)
  - LLM_API_KEY    -> Anthropic Claude (paid)
  - no key         -> "offline": built-in tips generated from your tasks.
If the AI call fails, the app falls back to offline tips and prints the
reason in the uvicorn terminal, so the app never depends on a key.
"""

import os
from datetime import date

import httpx

from models import AssistantResponse, Task

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
DEFAULT_CLAUDE_MODEL = "claude-haiku-5-5"

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest"   # fastest free model


def answer(question: str, tasks: list[Task], today: date) -> AssistantResponse:
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    claude_key = os.getenv("LLM_API_KEY", "").strip()
    try:
        if gemini_key:
            text = _ask_gemini(question, tasks, today, gemini_key)
            return AssistantResponse(answer=text, source="ai")
        if claude_key:
            text = _ask_claude(question, tasks, today, claude_key)
            return AssistantResponse(answer=text, source="ai")
    except Exception as error:
        # Show why in the uvicorn terminal, then fall back to offline tips
        print(f"[assistant] AI call failed, using offline tips: {error}")
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


def _system_prompt(tasks: list[Task], today: date) -> str:
    return (
        "You are a concise study coach inside a study planner app. "
        f"Today is {today}. {_task_summary(tasks, today)} "
        "Answer in under 150 words. Use short bullet points when listing steps. "
        "Use plain text, no markdown headings or bold."
    )


def _ask_gemini(question: str, tasks: list[Task], today: date, api_key: str) -> str:
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    response = httpx.post(
        GEMINI_URL.format(model=model),
        headers={"x-goog-api-key": api_key, "content-type": "application/json"},
        json={
            "system_instruction": {"parts": [{"text": _system_prompt(tasks, today)}]},
            "contents": [{"role": "user", "parts": [{"text": question}]}],
            "generationConfig": {"maxOutputTokens": 2048},
        },
        timeout=60,
    )
    response.raise_for_status()
    parts = response.json()["candidates"][0]["content"]["parts"]
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise ValueError("Gemini returned an empty answer")
    return text


def _ask_claude(question: str, tasks: list[Task], today: date, api_key: str) -> str:
    response = httpx.post(
        ANTHROPIC_URL,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": os.getenv("LLM_MODEL", DEFAULT_CLAUDE_MODEL),
            "max_tokens": 400,
            "system": _system_prompt(tasks, today),
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


def _what_next(open_tasks: list[Task], today: date) -> str:
    if not open_tasks:
        return "Nothing open. Good moment to review notes or rest."
    first = open_tasks[0]
    days = (first.deadline - today).days
    if days < 0:
        when = "it's already overdue"
    elif days == 0:
        when = "it's due today"
    else:
        when = f"it's due in {days} day{'s' if days != 1 else ''}"
    text = f"Work on \"{first.title}\" ({first.course}) next: {when}, and it needs {first.est_hours}h."
    if len(open_tasks) > 1:
        after = open_tasks[1]
        text += f"\nAfter that: \"{after.title}\" ({after.course})."
    return text


# Words that point to each kind of question
TOPICS = {
    "breakdown": ["break", "split", "steps", "divide", "chunk", "how do i start", "how to start"],
    "plan": ["plan", "exam", "prepare", "schedule", "organi", "week", "deadline", "overview"],
    "tips": ["revision", "revise", "tip", "memor", "focus", "concentrat", "procrastinat",
             "motivat", "learn", "study better", "advice"],
    "next": ["next", "now", "today", "what should", "what to do", "what do i do",
             "todo", "to do", "start", "first", "priority", "urgent", "begin"],
}


def offline_answer(question: str, tasks: list[Task], today: date) -> str:
    q = question.lower()
    open_tasks = sorted([t for t in tasks if not t.completed],
                        key=lambda t: (t.deadline, t.priority))

    def asks(topic: str) -> bool:
        return any(word in q for word in TOPICS[topic])

    if asks("breakdown"):
        if not open_tasks:
            return "Add a task first, then I can break it into study sessions."
        # If the question names a task, break that one down; else the biggest
        named = [t for t in open_tasks if t.title.lower() in q]
        target = named[0] if named else max(open_tasks, key=lambda t: t.est_hours)
        return _break_down(target)

    if asks("plan"):
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

    if asks("tips"):
        return ("Revision tips:\n"
                "- Use 25-minute focus sessions with 5-minute breaks.\n"
                "- Test yourself before re-reading: old exams, flashcards.\n"
                "- Revisit each topic after 1 day, 3 days and 1 week.\n"
                "- Explain the topic out loud as if teaching a friend.")

    if asks("next"):
        return _what_next(open_tasks, today)

    # Anything else: still give something useful, then say what else works
    return (_what_next(open_tasks, today) + "\n\n"
            "Offline mode answers questions about your plan, what to do next, breaking down "
            "a task, and study tips. Add an LLM_API_KEY to the backend to ask anything.")