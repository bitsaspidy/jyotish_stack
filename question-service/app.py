"""Internal FastAPI surface for the free Prashna question classifier."""

from __future__ import annotations

import os

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from classifier import SERVICE_VERSION, analyze_question


app = FastAPI(title="Jyotish Question Understanding", version=SERVICE_VERSION, docs_url=None, redoc_url=None)


class AnalyzeRequest(BaseModel):
    question: str = Field(min_length=8, max_length=500)
    selected_category: str = Field(default="general", max_length=40)
    analysis_mode: str = Field(default="prashna", pattern="^(prashna|kundli)$")


def _authorize(token: str | None) -> None:
    expected = os.getenv("QUESTION_SERVICE_TOKEN", "").strip()
    if expected and token != expected:
        raise HTTPException(status_code=403, detail="Forbidden")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": SERVICE_VERSION}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest, x_internal_token: str | None = Header(default=None)) -> dict:
    _authorize(x_internal_token)
    return analyze_question(payload.question, payload.selected_category, payload.analysis_mode)
