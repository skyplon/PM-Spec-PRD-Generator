"""
PM Spec Generator — FastAPI Backend
────────────────────────────────────
Endpoints:
  POST /api/generate          Generate PRD from idea (with optional web research)
  POST /api/refine            Refine an existing PRD with a natural language instruction
  POST /api/export/markdown   Export PRD as a markdown string
  GET  /api/health            Health check
"""

import os
import json
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from .exporters import prd_to_docx, prd_to_pdf
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from ..models.schemas import GenerateRequest, RefineRequest, PRDSpec
from ..agents.research import research_agent
from ..agents.spec_writer import spec_writer_agent, refine_spec_agent

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PM Spec Generator API",
    version="1.0.0",
    description="Turn a 2-sentence idea into a full PRD with web research",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Streaming generator ───────────────────────────────────────────────────────

async def generate_stream(request: GenerateRequest):
    """
    Streams server-sent events to the frontend as each stage completes.
    Blocking agent calls run in a thread pool so the event loop stays free
    to flush SSE events to the browser immediately.
    """
    import asyncio
    loop = asyncio.get_event_loop()

    def sse(event: dict) -> str:
        return f"data: {json.dumps(event)}\n\n"

    # Stage 1 — Research
    research_context = ""
    if request.search_web:
        yield sse({"stage": "researching", "message": "Searching the web for competitive context..."})
        await asyncio.sleep(0)   # flush to browser immediately
        try:
            research_context = await loop.run_in_executor(
                None, research_agent, request.idea, request.domain
            )
            yield sse({"stage": "research_done", "message": "Research complete", "data": research_context[:500]})
            await asyncio.sleep(0)
        except Exception as e:
            yield sse({"stage": "research_error", "message": f"Research skipped: {e}"})
            await asyncio.sleep(0)
    else:
        yield sse({"stage": "research_skipped", "message": "Skipping web research"})
        await asyncio.sleep(0)

    # Stage 2 — Write PRD
    yield sse({"stage": "writing", "message": "Writing your PRD with Claude..."})
    await asyncio.sleep(0)   # flush before the long LLM call
    try:
        prd = await loop.run_in_executor(
            None, spec_writer_agent, request, research_context
        )
        yield sse({"stage": "done", "data": prd.model_dump()})
    except Exception as e:
        logger.error(f"[API] Spec generation failed: {e}")
        yield sse({"stage": "error", "message": str(e)})


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/api/generate")
async def generate(request: GenerateRequest):
    """
    Streams the full generation pipeline as server-sent events.
    Frontend reads the stream and updates UI at each stage.
    """
    if not request.idea.strip():
        raise HTTPException(status_code=400, detail="idea cannot be empty")

    return StreamingResponse(
        generate_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@app.post("/api/refine", response_model=PRDSpec)
async def refine(request: RefineRequest):
    """
    Refines an existing PRD with a natural language instruction.
    Returns the updated PRDSpec directly (no streaming needed — faster).
    """
    if not request.instruction.strip():
        raise HTTPException(status_code=400, detail="instruction cannot be empty")

    try:
        refined = refine_spec_agent(request.prd, request.instruction)
        return refined
    except Exception as e:
        logger.error(f"[API] Refinement failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/markdown")
async def export_markdown(prd: PRDSpec):
    """Converts the PRD to a well-formatted markdown document."""
    md = _prd_to_markdown(prd)
    return {"markdown": md}


@app.post("/api/export/docx")
async def export_docx(prd: PRDSpec):
    """Returns a formatted Word (.docx) document."""
    try:
        docx_bytes = prd_to_docx(prd)
        filename = prd.title[:50].replace(" ", "_").replace("/", "-") + ".docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"[API] DOCX export failed: {e}")
        raise HTTPException(status_code=500, detail=f"DOCX export failed: {e}")


@app.post("/api/export/pdf")
async def export_pdf(prd: PRDSpec):
    """Returns a formatted PDF document."""
    try:
        pdf_bytes = prd_to_pdf(prd)
        filename = prd.title[:50].replace(" ", "_").replace("/", "-") + ".pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        logger.error(f"[API] PDF export failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF export failed: {e}")


# ── Markdown exporter ─────────────────────────────────────────────────────────

def _prd_to_markdown(prd: PRDSpec) -> str:
    priority_labels = {
        "must-have":    "🔴 Must-have",
        "should-have":  "🟡 Should-have",
        "nice-to-have": "🟢 Nice-to-have",
    }

    lines = [
        f"# {prd.title}",
        f"\n> {prd.tldr}",
        f"\n## Problem statement\n\n{prd.problem_statement}",
        f"\n## Goal\n\n{prd.goal}",
        f"\n## Target users\n\n" + "\n".join(f"- {u}" for u in prd.target_users),
    ]

    if prd.competitive_context:
        lines.append("\n## Competitive context\n")
        for c in prd.competitive_context:
            lines.append(f"### {c.competitor}")
            lines.append(f"- **How they solve it:** {c.how_they_solve_it}")
            lines.append(f"- **Gap / opportunity:** {c.gap_or_opportunity}\n")

    lines.append("\n## User stories\n")
    for i, story in enumerate(prd.user_stories, 1):
        label = priority_labels.get(story.priority, story.priority)
        lines.append(f"### Story {i} — {label}")
        lines.append(f"**As a** {story.persona}, **I want** {story.goal} **so that** {story.benefit}\n")
        lines.append("**Acceptance criteria:**")
        for ac in story.criteria:
            lines.append(f"- **Given** {ac.given} **when** {ac.when} **then** {ac.then}")
        lines.append("")

    lines.append("\n## Success metrics\n")
    lines.append("| Metric | Baseline | Target | Timeframe |")
    lines.append("|--------|----------|--------|-----------|")
    for m in prd.success_metrics:
        lines.append(f"| {m.metric} | {m.baseline} | {m.target} | {m.timeframe} |")

    lines.append(f"\n## Out of scope\n\n" + "\n".join(f"- {o}" for o in prd.out_of_scope))
    lines.append(f"\n## Edge cases\n\n" + "\n".join(f"- {e}" for e in prd.edge_cases))
    lines.append(f"\n## Risks\n\n" + "\n".join(f"- {r}" for r in prd.risks))
    lines.append(f"\n## Open questions\n\n" + "\n".join(f"- [ ] {q}" for q in prd.open_questions))

    return "\n".join(lines)
