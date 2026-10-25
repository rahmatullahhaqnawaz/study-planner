from datetime import date

from fastapi import FastAPI

# Optional: read LLM_API_KEY from a .env file (pip install python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from fastapi.middleware.cors import CORSMiddleware

from assistant import answer
from models import (AssistantRequest, AssistantResponse, ScheduleRequest,
                    ScheduleResponse)
from scheduler import schedule

app = FastAPI(title="Study Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Study Planner API is running. See /docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/schedule", response_model=ScheduleResponse)
def create_schedule(request: ScheduleRequest):
    start = request.start_date or date.today()
    return schedule(request.tasks, request.availability, start)


@app.post("/api/assistant", response_model=AssistantResponse)
def ask_assistant(request: AssistantRequest):
    return answer(request.question, request.tasks, date.today())
