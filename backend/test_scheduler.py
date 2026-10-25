from datetime import date

from fastapi.testclient import TestClient

from main import app
from models import Availability, Task
from scheduler import schedule

# A fixed Monday, so the tests give the same result on any day you run them
MONDAY = date(2026, 10, 26)
DEFAULT = Availability()   # Mon-Fri 3h, Sat-Sun 5h

client = TestClient(app)


def make_task(id, deadline, hours, priority=2, completed=False):
    return Task(id=id, course="OS", title=f"Task {id}",
                deadline=deadline, est_hours=hours,
                priority=priority, completed=completed)


def hours_for(result, task_id):
    """Total hours planned for one task across all days."""
    return sum(b.hours for d in result.days for b in d.blocks if b.task_id == task_id)


# ---------- The scheduler itself ----------

def test_empty_list_gives_empty_week():
    result = schedule([], DEFAULT, MONDAY)
    assert len(result.days) == 7
    assert all(d.blocks == [] for d in result.days)
    assert result.at_risk == []


def test_single_task_is_fully_planned():
    task = make_task("a", date(2026, 10, 28), hours=5)   # Wednesday
    result = schedule([task], DEFAULT, MONDAY)
    assert hours_for(result, "a") == 5
    assert result.days[0].planned_hours == 3   # Monday is full
    assert result.days[1].planned_hours == 2   # the rest on Tuesday
    assert result.at_risk == []


def test_earlier_deadline_goes_first():
    later = make_task("later", date(2026, 10, 30), hours=3)
    sooner = make_task("sooner", date(2026, 10, 27), hours=3)
    result = schedule([later, sooner], DEFAULT, MONDAY)
    assert result.days[0].blocks[0].task_id == "sooner"


def test_same_deadline_higher_priority_first():
    low = make_task("low", date(2026, 10, 30), hours=2, priority=3)
    high = make_task("high", date(2026, 10, 30), hours=2, priority=1)
    result = schedule([low, high], DEFAULT, MONDAY)
    assert result.days[0].blocks[0].task_id == "high"


def test_never_exceeds_daily_hours():
    tasks = [make_task(str(i), date(2026, 11, 1), hours=4) for i in range(5)]
    result = schedule(tasks, DEFAULT, MONDAY)
    for day in result.days:
        assert day.planned_hours <= day.available_hours


def test_overloaded_task_is_at_risk():
    # Due Tuesday: only Mon + Tue = 6h available, task needs 10h
    task = make_task("big", date(2026, 10, 27), hours=10)
    result = schedule([task], DEFAULT, MONDAY)
    assert hours_for(result, "big") == 6
    assert len(result.at_risk) == 1
    assert result.at_risk[0].reason == "not_enough_time"
    assert result.at_risk[0].hours_unscheduled == 4


def test_past_deadline_is_overdue_not_planned():
    task = make_task("old", date(2026, 10, 20), hours=3)
    result = schedule([task], DEFAULT, MONDAY)
    assert hours_for(result, "old") == 0
    assert result.at_risk[0].reason == "overdue"


def test_completed_tasks_are_ignored():
    task = make_task("done", date(2026, 10, 28), hours=3, completed=True)
    result = schedule([task], DEFAULT, MONDAY)
    assert hours_for(result, "done") == 0
    assert result.at_risk == []


def test_day_with_zero_hours_is_skipped():
    no_monday = Availability(monday=0)
    task = make_task("a", date(2026, 10, 28), hours=2)
    result = schedule([task], no_monday, MONDAY)
    assert result.days[0].blocks == []
    assert result.days[1].blocks[0].task_id == "a"


# ---------- The API endpoint ----------

def test_api_returns_a_plan():
    body = {
        "start_date": "2026-10-26",
        "tasks": [{"id": "a", "course": "OS", "title": "Sheet 4",
                   "deadline": "2026-10-28", "est_hours": 4, "priority": 1}],
    }
    response = client.post("/api/schedule", json=body)
    assert response.status_code == 200
    data = response.json()
    assert len(data["days"]) == 7
    assert data["at_risk"] == []


def test_api_rejects_zero_hours():
    body = {"tasks": [{"id": "a", "course": "OS", "title": "Sheet 4",
                       "deadline": "2026-10-28", "est_hours": 0}]}
    response = client.post("/api/schedule", json=body)
    assert response.status_code == 422


def test_api_rejects_empty_title():
    body = {"tasks": [{"id": "a", "course": "OS", "title": "   ",
                       "deadline": "2026-10-28", "est_hours": 2}]}
    response = client.post("/api/schedule", json=body)
    assert response.status_code == 422


# ---------- Block times ----------

def test_blocks_get_start_and_end_times():
    a = make_task("a", date(2026, 10, 26), hours=1, priority=1)
    b = make_task("b", date(2026, 10, 26), hours=2, priority=2)
    result = schedule([a, b], Availability(day_start=16), MONDAY)
    first, second = result.days[0].blocks
    assert (first.start, first.end) == ("16:00", "17:00")
    assert (second.start, second.end) == ("17:00", "19:00")


def test_never_plans_past_midnight():
    late = Availability(day_start=22, monday=5)
    task = make_task("a", date(2026, 10, 26), hours=5)
    result = schedule([task], late, MONDAY)
    assert result.days[0].planned_hours == 2
    assert result.days[0].blocks[0].end == "24:00"
