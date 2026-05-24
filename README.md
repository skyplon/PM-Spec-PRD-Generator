# PM Spec Generator

**An AI-powered tool that transforms a feature idea into a structured, developer-ready PRD in under 30 seconds** — complete with competitive research, typed user stories, acceptance criteria, success metrics, and engineering-ready edge cases.

Built for product managers who spend 4–8 hours writing specs that could be written in minutes with the right AI pipeline behind them.

---

## The Problem

Writing a PRD from a raw idea is one of the highest-friction tasks in a PM's week. The process is sequential and labor-intensive: research competitors, translate vague requirements into testable user stories, anticipate edge cases engineering will surface anyway, define metrics with baselines, and surface the open questions that will block the build.

Most teams short-circuit this process and ship specs that are thin on competitive context, weak on acceptance criteria, and missing the edge cases that come back as scope creep. The result is misaligned engineering work, rework cycles, and delayed launches.

This tool compresses that process into a single AI pipeline that does the research, structures the output, and lets the PM iterate through natural language — so the spec that reaches engineering is grounded, specific, and ready for review.

---

## What It Produces

Given a feature description (2–4 sentences), the tool outputs a complete PRD structured as:

| Section | Description |
|---|---|
| Problem statement | Clear articulation of user pain and current gap in the market |
| Goal | Measurable success definition — for the product and for the user |
| Target personas | 2–3 specific user types with role and behavioral context |
| Competitive context | How existing products solve this today, and where the opportunity lies — sourced from live web research |
| User stories | 3 stories in As a / I want / So that format with priority classification |
| Acceptance criteria | Given/When/Then criteria per story — specific, testable, implementation-ready |
| Success metrics | 3 metrics with current baseline, target, and timeframe |
| Out of scope | Explicit boundaries to prevent scope creep |
| Edge cases | 4 engineering-relevant scenarios the build must handle |
| Risks | Delivery and adoption risks with mitigations |
| Open questions | Unresolved decisions that must be answered before build starts |

**Export formats:** Word (.docx) · PDF · Markdown · Google Docs

---

## Screenshots

### Input — describe the feature in plain language
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%201.png?raw=true" width="700"/>

### Live pipeline — web research fires first, spec writing second
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%202.png?raw=true" width="400"/>

### Overview — problem statement, goal, and target users
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%203.png?raw=true" width="400"/>

### User stories — prioritized with Given/When/Then acceptance criteria
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%204.png?raw=true" width="400"/>

### Success metrics — baseline, target, and timeframe
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%205.png?raw=true" width="400"/>

### Competitive context — sourced from live web search at generation time
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%206.png?raw=true" width="400"/>

### Risks and edge cases
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%207.png?raw=true" width="400"/>

### Iterative refinement — update the spec through natural language
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%208.png?raw=true" width="400"/>

### Export — Word, PDF, Markdown, or directly to Google Docs
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%209.png?raw=true" width="400"/>

---

## How It Works

The system runs three stages in sequence, each using a different AI capability:

```
Feature idea (plain language input)
              │
              ▼
┌─────────────────────────────────────────┐
│  Stage 1 — Competitive Research         │
│                                         │
│  Claude runs live web search to find    │
│  how existing products handle this      │
│  feature today. Sources: product pages, │
│  G2 reviews, Reddit, changelog posts.   │
│                                         │
│  Output: grounded competitive summary   │
└──────────────────┬──────────────────────┘
                   │  injected as context
                   ▼
┌─────────────────────────────────────────┐
│  Stage 2 — Spec Generation              │
│                                         │
│  Claude + Instructor generates a full   │
│  PRD against a strict Pydantic schema.  │
│  Every field — including nested         │
│  acceptance criteria — is typed and     │
│  validated before leaving the server.   │
│                                         │
│  Output: PRDSpec (structured object)    │
└──────────────────┬──────────────────────┘
                   │  streamed to UI via SSE
                   ▼
┌─────────────────────────────────────────┐
│  Stage 3 — Refinement Loop              │
│                                         │
│  PM iterates through natural language.  │
│  Each instruction sends the full PRD    │
│  as context — Claude edits targeted     │
│  sections while preserving the rest.    │
│                                         │
│  Output: updated PRD, same schema       │
└─────────────────────────────────────────┘
```

---

## Design Decisions

**Research before writing.** A PRD written without competitive context produces user stories that already exist in three competing products. Running the research agent first grounds the spec in what the market does today — and where the actual gap is.

**Typed output over free text.** Unstructured LLM output cannot drive a product UI reliably. Every API call uses Instructor to enforce the PRDSpec Pydantic schema — including nested acceptance criteria — so the frontend always receives a predictable, validated object.

**Streaming over polling.** A 30-second request with no feedback degrades trust in the tool. SSE lets the UI surface exactly what is happening at each stage — research fired, research complete with a snippet of findings, writing in progress, done. The live elapsed timer makes the cost of each step visible.

**Full context in refinement.** Sending only a summary to the refinement agent loses the detail needed for targeted edits. The full PRD serialized as JSON is injected into each refinement prompt so Claude can make precise changes without reconstructing the spec from scratch.

---

## Technical Implementation

| Component | Technology | Implementation detail |
|---|---|---|
| LLM | `claude-haiku-4-5-20251001` | Research agent, spec writer, and refinement loop |
| Web search | `web_search_20250305` tool (Anthropic) | Live competitor research injected into spec prompt |
| Structured output | Instructor + Pydantic v2 | PRDSpec schema enforced on every LLM call |
| Streaming | FastAPI SSE + `ReadableStream` | Pipeline stage events pushed to browser in real time |
| Async | `asyncio.run_in_executor` | Blocking LLM calls offloaded from event loop |
| Backend | FastAPI + Uvicorn | `/generate` (SSE), `/refine`, `/export/docx`, `/export/pdf` |
| Frontend | React 18 + Vite | Input form, live pipeline view, tabbed PRD viewer |
| Word export | python-docx | Formatted .docx with headings, metrics table, bullets |
| PDF export | fpdf2 | Multi-page PDF with headers, page numbers, clean layout |

---

## Project Structure

```
PM-Spec-PRD-Generator/
├── backend/
│   ├── agents/
│   │   ├── research.py        Live web search via Claude tool use
│   │   └── spec_writer.py     PRD generation and refinement via Instructor
│   ├── api/
│   │   ├── main.py            FastAPI — SSE streaming, endpoints, async patterns
│   │   └── exporters.py       DOCX and PDF generation from PRDSpec
│   ├── models/
│   │   └── schemas.py         Full PRDSpec Pydantic schema with nested types
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             SSE stream reader, state management, refine loop
    │   └── components/
    │       ├── InputForm.jsx       Feature input with built-in examples
    │       ├── GeneratingView.jsx  Live timer, pipeline stages, agent event log
    │       └── PRDView.jsx         Tabbed PRD viewer, refinement chat, export panel
    └── vite.config.js
```

---

## Setup

### Requirements
- Python 3.11+
- Node 18+
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and configure
```bash
git clone https://github.com/skyplon/PM-Spec-PRD-Generator.git
cd PM-Spec-PRD-Generator/backend
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
```

### 2. Install backend
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start backend
```bash
# Must run from project root for relative imports to resolve
cd PM-Spec-PRD-Generator
uvicorn backend.api.main:app --reload --port 8001
```

### 4. Start frontend
```bash
cd frontend
npm install && npm run dev
```

Open **http://localhost:5174**

### Convenience script
```bash
# After initial setup, use the included start script
./start.sh
```

---

## Refinement Examples

| Instruction | Effect |
|---|---|
| `Make acceptance criteria more specific with exact thresholds and numbers` | Rewrites all Given/When/Then criteria with quantified conditions |
| `Add 2 more edge cases around API rate limiting and third-party failures` | Expands edge cases section with infrastructure-specific scenarios |
| `Rewrite the success metrics with tighter targets and shorter timeframes` | Updates baselines, targets, and measurement windows |
| `Make this more mobile-focused` | Updates personas, stories, and constraints for mobile context |
| `Add risks around GDPR compliance for EU users` | Expands risk section with regulatory and data handling considerations |

---

## Related Work

- [AI Meeting Co-pilot](https://github.com/skyplon/ai-meeting-copilot) — LangGraph agent pipeline that converts meeting transcripts into action items, routed tasks, and follow-up emails
- [Prospect-IQ](https://github.com/skyplon/Prospect-IQ) — AI sales intelligence tool for Enterprise SDRs
- [GTM-Ops-Agent](https://github.com/skyplon/GTM-Ops-Agent) — AI-powered GTM planning automation for Sales Operations

---

## Author

**Juan Manuel Navarrete Solano**
Senior Product Manager — Agentic AI & Generative AI

[LinkedIn](https://www.linkedin.com/in/juanmanuelnavarretesolano/) · [GitHub](https://github.com/skyplon)
