from datetime import date
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Input ----------

class Task(BaseModel):
    """One study task, as the frontend sends it."""

    # Trim spaces from all text fields, so "   " becomes "" and fails min_length
    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(min_length=1)
    course: str = Field(min_length=1, max_length=60)
    title: str = Field(min_length=1, max_length=120)
    deadline: date
    est_hours: int = Field(gt=0, le=100)   # more than 0, at most 100
    priority: Literal[1, 2, 3] = 2         # 1 = high, 2 = medium, 3 = low
    completed: bool = False


# Hours you can study on one day: 0 to 24
DayHours = Annotated[int, Field(ge=0, le=24)]


class Availability(BaseModel):
    """How many hours you can study on each weekday."""

    monday: DayHours = 3
    tuesday: DayHours = 3
    wednesday: DayHours = 3
    thursday: DayHours = 3
    friday: DayHours = 3
    saturday: DayHours = 5
    sunday: DayHours = 5
    day_start: int = Field(default=9, ge=0, le=23)   # first study hour, 9 = 09:00

    def hours_on(self, day: date) -> int:
        # date.weekday(): Monday = 0 ... Sunday = 6
        names = ["monday", "tuesday", "wednesday", "thursday",
                 "friday", "saturday", "sunday"]
        hours = getattr(self, names[day.weekday()])
        # Never plan past midnight
        return min(hours, 24 - self.day_start)


class ScheduleRequest(BaseModel):
    """Body of POST /api/schedule."""

    tasks: list[Task]
    availability: Availability = Availability()
    start_date: Optional[date] = None   # defaults to today on the server


# ---------- Output ----------

class Block(BaseModel):
    """Time given to one task on one day."""

    task_id: str
    course: str
    title: str
    hours: int
    start: str   # "09:00"
    end: str     # "11:00"


class DayPlan(BaseModel):
    date: date
    available_hours: int
    planned_hours: int
    blocks: list[Block]


class AtRiskTask(BaseModel):
    task_id: str
    title: str
    reason: Literal["overdue", "not_enough_time"]
    hours_unscheduled: int


class ScheduleResponse(BaseModel):
    days: list[DayPlan]
    at_risk: list[AtRiskTask]


# ---------- Assistant ----------

class AssistantRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    question: str = Field(min_length=1, max_length=1000)
    tasks: list[Task] = []


class AssistantResponse(BaseModel):
    answer: str
    source: Literal["ai", "offline"]   # "offline" = built-in tips, no API key needed
