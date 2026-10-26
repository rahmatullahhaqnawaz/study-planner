from datetime import date

from fastapi.testclient import TestClient

from assistant import offline_answer
from main import app
from models import Task

TODAY = date(2026, 10, 26)
client = TestClient(app)


def task(id, title, hours, deadline, completed=False):
    return Task(id=id, course="OS", title=title, est_hours=hours,
                deadline=deadline, completed=completed)


def test_breakdown_uses_biggest_task():
    tasks = [task("a", "Quiz", 1, date(2026, 10, 27)),
             task("b", "Project", 5, date(2026, 11, 2))]
    text = offline_answer("Break down this task", tasks, TODAY)
    assert "Project" in text
    assert "1. 2h" in text and "3. 1h" in text


def test_plan_starts_with_earliest_deadline():
    tasks = [task("a", "Later", 2, date(2026, 11, 5)),
             task("b", "Sooner", 2, date(2026, 10, 28))]
    text = offline_answer("Create a study plan for exam", tasks, TODAY)
    assert "Start with \"Sooner\"" in text
    assert "in 2 days" in text


def test_completed_tasks_are_ignored():
    tasks = [task("a", "Done one", 2, date(2026, 10, 28), completed=True)]
    text = offline_answer("what should I do next", tasks, TODAY)
    assert "Nothing open" in text


def test_api_works_without_key(monkeypatch):
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/assistant", json={"question": "Give me revision tips"})
    assert response.status_code == 200
    assert response.json()["source"] == "offline"


def test_api_rejects_empty_question():
    response = client.post("/api/assistant", json={"question": "   "})
    assert response.status_code == 422


def test_understands_casual_what_to_do():
    tasks = [task("a", "Hw 6", 5, date(2026, 10, 30)),
             task("b", "Project", 8, date(2026, 10, 29))]
    text = offline_answer("what to do", tasks, TODAY)
    assert text.startswith("Work on \"Project\"")
    assert "After that: \"Hw 6\"" in text


def test_unknown_question_still_helps():
    tasks = [task("a", "Hw 6", 5, date(2026, 10, 30))]
    text = offline_answer("hello there", tasks, TODAY)
    assert "Work on \"Hw 6\"" in text
    assert "LLM_API_KEY" in text


def test_breakdown_uses_named_task():
    tasks = [task("a", "Quiz", 1, date(2026, 10, 27)),
             task("b", "Project", 6, date(2026, 11, 2))]
    text = offline_answer("break down quiz", tasks, TODAY)
    assert "Quiz" in text


# ---------- AI mode (the network call is faked, so no key is needed) ----------

class FakeResponse:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self._data


def test_gemini_answer_is_used(monkeypatch):
    import assistant
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    seen = {}

    def fake_post(url, headers, json, timeout):
        seen["url"], seen["key"] = url, headers["x-goog-api-key"]
        return FakeResponse({"candidates": [{"content": {"parts": [{"text": "Start with Hw 6."}]}}]})

    monkeypatch.setattr(assistant.httpx, "post", fake_post)
    result = assistant.answer("what now?", [], TODAY)
    assert result.source == "ai"
    assert result.answer == "Start with Hw 6."
    assert "generateContent" in seen["url"] and seen["key"] == "test-key"


def test_failed_ai_call_falls_back_to_offline(monkeypatch):
    import assistant
    monkeypatch.setenv("GEMINI_API_KEY", "bad-key")

    def broken_post(*args, **kwargs):
        raise RuntimeError("401 Unauthorized")

    monkeypatch.setattr(assistant.httpx, "post", broken_post)
    result = assistant.answer("give me revision tips", [], TODAY)
    assert result.source == "offline"
    assert "Revision tips" in result.answer