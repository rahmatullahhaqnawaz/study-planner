"""The scheduling algorithm.

schedule() is a pure function: same input -> same output, no database,
no network, no clock (start_date is passed in). That makes it easy to test.

Strategy: Earliest Deadline First (EDF), a classic greedy algorithm.
  1. Skip completed tasks.
  2. Tasks whose deadline is already before start_date are "overdue".
  3. Sort the rest by deadline, then by priority (1 = high first).
  4. For each task, fill free hours day by day, from start_date up to and
     including its deadline.
  5. Hours that don't fit before the deadline make the task "at risk".
"""

from datetime import date, timedelta

from models import (AtRiskTask, Availability, Block, DayPlan,
                    ScheduleResponse, Task)

MIN_DAYS = 7       # always return at least one week, so the plan view is full
MAX_DAYS = 90      # safety limit for very distant deadlines


def schedule(tasks: list[Task], availability: Availability,
             start_date: date) -> ScheduleResponse:
    open_tasks = [t for t in tasks if not t.completed]

    at_risk: list[AtRiskTask] = []
    plannable: list[Task] = []
    for task in open_tasks:
        if task.deadline < start_date:
            at_risk.append(AtRiskTask(
                task_id=task.id, title=task.title,
                reason="overdue", hours_unscheduled=task.est_hours,
            ))
        else:
            plannable.append(task)

    # How many days does the plan cover?
    last_deadline = max((t.deadline for t in plannable), default=start_date)
    span = (last_deadline - start_date).days + 1
    num_days = min(max(span, MIN_DAYS), MAX_DAYS)

    days = []
    for i in range(num_days):
        d = start_date + timedelta(days=i)
        hours = availability.hours_on(d)
        days.append({"date": d, "available": hours, "free": hours, "blocks": []})

    # Earliest deadline first; on the same deadline, higher priority first
    plannable.sort(key=lambda t: (t.deadline, t.priority))

    for task in plannable:
        remaining = task.est_hours
        for day in days:
            if remaining == 0 or day["date"] > task.deadline:
                break
            take = min(day["free"], remaining)
            if take > 0:
                # Blocks follow each other: the next one starts where the last ended
                start_hour = availability.day_start + day["available"] - day["free"]
                day["blocks"].append(Block(
                    task_id=task.id, course=task.course,
                    title=task.title, hours=take,
                    start=f"{start_hour:02d}:00",
                    end=f"{start_hour + take:02d}:00",
                ))
                day["free"] -= take
                remaining -= take
        if remaining > 0:
            at_risk.append(AtRiskTask(
                task_id=task.id, title=task.title,
                reason="not_enough_time", hours_unscheduled=remaining,
            ))

    return ScheduleResponse(
        days=[
            DayPlan(
                date=day["date"],
                available_hours=day["available"],
                planned_hours=day["available"] - day["free"],
                blocks=day["blocks"],
            )
            for day in days
        ],
        at_risk=at_risk,
    )
