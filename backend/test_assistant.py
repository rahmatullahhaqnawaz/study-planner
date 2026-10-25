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
    response = client.post("/api/assistant", json={"question": "Give me revision tips"})
    assert response.status_code == 200
    assert response.json()["source"] == "offline"


def test_api_rejects_empty_question():
    response = client.post("/api/assistant", json={"question": "   "})
    assert response.status_code == 422
