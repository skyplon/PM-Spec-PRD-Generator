# PM Spec Generator ✦

> Turn a 2-sentence feature idea into a developer-ready PRD with user stories, acceptance criteria, competitive research, and success metrics — in 30 seconds.

**A portfolio project built to showcase Agentic AI and Generative AI product thinking for PM roles at AI-first companies.**

---

## The Problem This Solves

Writing a PRD from scratch takes a senior PM 4–8 hours. That time is spent on:

- **Competitive research** — manually checking what Notion, Linear, Figma, or 5 other tools do
- **User story formatting** — translating a vague idea into testable Given/When/Then criteria
- **Edge case discovery** — thinking through what engineering will ask in the first 5 minutes of review
- **Open question identification** — surfacing the decisions that need to be made before build starts

This tool compresses those 4–8 hours into 30 seconds by running a research agent, a spec writer, an edge case analyst, and a risk assessor in a sequential AI pipeline — then lets you refine the output through natural language chat.

**The output is not a template fill-in. It is a judgment-based spec** informed by what competitors already built, grounded in Pydantic-enforced schemas, and ready to hand to engineering.

---

## Demo

**Input:** a feature idea in plain English (2–4 sentences)

**Output in ~30 seconds:**

| Section | What you get |
|---|---|
| Problem statement | Clear articulation of the user pain and current gap |
| Goal | Measurable success definition for product and user |
| Target users | 2–3 specific personas with role context |
| Competitive context | How 2–3 real competitors solve this today + gaps |
| User stories | 3 stories in As a / I want / So that format |
| Acceptance criteria | 2 Given/When/Then criteria per story — testable, specific |
| Success metrics | 3 metrics with baseline, target, and timeframe |
| Edge cases | 4 engineering-relevant edge cases |
| Risks | 3 delivery and adoption risks with mitigations |
| Open questions | 3 unresolved decisions that block the build |

**Export options:** Word (.docx) · PDF · Markdown · Google Docs

---

## Screenshots

### Input — describe your feature idea
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%201.png?raw=true" width="700"/>

### Live agent pipeline — web research fires first, spec writing second
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%202.png?raw=true" width="400"/>

### Results — overview tab with problem statement and goal
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%203.png?raw=true" width="400"/>

### User stories — Given/When/Then acceptance criteria
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%204.png?raw=true" width="400"/>

### Success metrics — baseline, target, timeframe table
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%205.png?raw=true" width="400"/>

### Competitive context — real competitor analysis from web search
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%206.png?raw=true" width="400"/>

### Risks and edge cases tab
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%207.png?raw=true" width="400"/>

### Refine this spec — iterative chat refinement
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%208.png?raw=true" width="400"/>

### Export options — Word, PDF, Markdown, Google Docs
<img src="https://github.com/skyplon/PM-Spec-PRD-Generator/blob/main/assets/Screenshot%209.png?raw=true" width="400"/>

---

## How It Works — The Agent Pipeline

The system runs three sequential AI steps. Each step uses a different Claude API capability to produce a different type of output.

```
User inputs feature idea (2-4 sentences)
              │
              ▼
┌─────────────────────────────────────┐
│         ResearchAgent               │
│                                     │
│  Claude web_search tool use         │
│  Searches for competitor products,  │
│  G2 reviews, Reddit complaints,     │
│  and pricing pages in real time     │
│                                     │
│  Output: 300-word research summary  │
└─────────────────┬───────────────────┘
                  │  research context injected into next prompt
                  ▼
┌─────────────────────────────────────┐
│         SpecWriterAgent             │
│                                     │
│  Claude + Instructor library        │
│  Generates PRD against a strict     │
│  Pydantic schema — every field      │
│  typed and validated before return  │
│                                     │
│  Output: PRDSpec (typed object)     │
└─────────────────┬───────────────────┘
                  │  structured JSON sent to frontend
                  ▼
┌─────────────────────────────────────┐
│         Frontend (React)            │
│                                     │
│  SSE stream renders stages live     │
│  Results displayed in tabbed view   │
│  Refinement loop via /api/refine    │
│  Export to DOCX / PDF / Markdown    │
└─────────────────────────────────────┘
```

---

## Product Thinking Behind the Design

**Why web research first?** A PRD written without competitive context produces user stories that already exist in 3 competing products. The research agent solves for the gap, not just the feature.

**Why Instructor + Pydantic?** Unstructured LLM output is not usable in a real product. Every field — including nested acceptance criteria — is typed, validated, and structured before it reaches the UI. Zero string parsing.

**Why SSE streaming?** A 30-second API call with a spinner is a frustrating UX. SSE lets the UI show exactly what is happening at each stage — research firing, research complete with a snippet of what was found, writing starting. The live elapsed timer shows the cost of intelligence in real time.

**Why iterative refinement?** The first spec is always wrong. PMs refine through conversation. The refinement loop sends the full PRD as JSON context plus a natural language instruction — Claude edits targeted sections while preserving everything else.

---

## AI Skills Demonstrated

| Skill | How it is demonstrated |
|---|---|
| **Claude API — web search tool use** | `ResearchAgent` calls Claude with `web_search_20250305` tool enabled. Claude decides which queries to run, reads the results, and synthesizes a research summary — all within one API call |
| **Structured outputs — Instructor + Pydantic** | Every Claude call goes through `instructor.from_anthropic()` with `response_model=PRDSpec`. The nested schema (stories → criteria, metrics → baseline/target) is enforced and validated before returning |
| **Streaming — Server-Sent Events** | FastAPI yields SSE events as each pipeline stage completes. The frontend reads the stream with `ReadableStream` and updates React state incrementally — no polling |
| **Sequential LLM chaining** | Research output is injected as context into the spec writing prompt. The chain is: web search → grounded PRD generation, not just PRD generation |
| **Iterative refinement loop** | `/api/refine` accepts the full PRD as JSON + a natural language instruction and returns the updated PRD. Claude edits only relevant sections |
| **Prompt engineering** | XML-structured prompts, explicit output constraints (exactly 3 stories, 2 AC each), few-shot persona grounding in system prompt, and output budget management |
| **Document generation** | `python-docx` and `fpdf2` generate properly formatted Word and PDF exports from the same Pydantic model — no template files |
| **FastAPI async patterns** | Blocking LLM calls run in `asyncio.run_in_executor()` to keep the event loop free for SSE flushing |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| LLM | `claude-haiku-4-5-20251001` | Research agent + spec writer + refinement |
| Web search | `web_search_20250305` tool | Live competitor research before spec writing |
| Structured output | Instructor + Pydantic v2 | Enforces PRDSpec schema on every LLM call |
| Streaming | FastAPI SSE + ReadableStream | Sends pipeline stage events to browser in real time |
| Backend | FastAPI + Uvicorn | REST API: /generate, /refine, /export/docx, /export/pdf |
| Frontend | React 18 + Vite | Input form, live pipeline view, tabbed results, export |
| Word export | python-docx | Formatted .docx with headings, bullet lists, metrics table |
| PDF export | fpdf2 | Clean multi-page PDF with headers and page numbers |
| Dependency injection | python-dotenv | API key management from .env file |

---

## Project Structure

```
PM-Spec-PRD-Generator/
├── backend/
│   ├── agents/
│   │   ├── research.py        Claude web_search tool use — competitive research
│   │   └── spec_writer.py     Claude + Instructor — PRD generation and refinement
│   ├── api/
│   │   ├── main.py            FastAPI app — SSE streaming, endpoints, async patterns
│   │   └── exporters.py       DOCX and PDF generation from PRDSpec
│   ├── models/
│   │   └── schemas.py         PRDSpec Pydantic schema — all nested types
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             SSE stream reader, state management, refine loop
    │   └── components/
    │       ├── InputForm.jsx       Feature idea input + 3 example loaders
    │       ├── GeneratingView.jsx  Live timer, pipeline progress, agent log
    │       └── PRDView.jsx         Tabbed results + refinement chat + export panel
    └── vite.config.js
```

---

## PRD Schema — What Gets Generated

```python
class PRDSpec(BaseModel):
    title:               str
    tldr:                str                        # one-sentence summary
    problem_statement:   str
    goal:                str
    target_users:        list[str]                  # 2-3 personas
    competitive_context: list[CompetitorInsight]    # from web search
    user_stories:        list[UserStory]            # 3 stories
    success_metrics:     list[SuccessMetric]        # baseline → target → timeframe
    out_of_scope:        list[str]
    edge_cases:          list[str]                  # 4 engineering-ready cases
    risks:               list[str]                  # 3 risks with mitigations
    open_questions:      list[str]                  # 3 blocking decisions

class UserStory(BaseModel):
    persona:  str
    goal:     str
    benefit:  str
    criteria: list[AcceptanceCriteria]              # Given / When / Then
    priority: Literal["must-have", "should-have", "nice-to-have"]

class SuccessMetric(BaseModel):
    metric:    str
    baseline:  str
    target:    str
    timeframe: str
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
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Install backend
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Start backend
```bash
# Run from project root — required for relative imports
cd ~/PM-Spec-PRD-Generator
uvicorn backend.api.main:app --reload --port 8001
```

### 4. Start frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174** and click one of the example ideas to test immediately.

### One-command start (after first setup)
```bash
~/PM-Spec-PRD-Generator/start.sh
```

---

## Example Ideas to Try

**Short and specific (best results):**
```
Add a smart meeting scheduler that analyzes calendar availability across all 
attendees, suggests the 3 best time slots based on working hours and time zones, 
and automatically sends calendar invites with a pre-filled agenda template.
```

**Product domain + user context:**
```
Build an AI writing assistant for our email composer that suggests subject lines, 
rewrites paragraphs for tone, and flags emails that sound aggressive before sending.
```

**Internal tool idea:**
```
Create an automated expense approval workflow that uses AI to flag unusual spending, 
route approvals to the right manager based on amount and category, and auto-approve 
recurring expenses under a set threshold.
```

---

## Refinement Examples

After generating a PRD, use the refinement chat to iterate:

| Instruction | What changes |
|---|---|
| `Make the acceptance criteria more specific with exact thresholds` | All Given/When/Then criteria rewritten with numbers |
| `Add 2 more edge cases for offline usage` | Edge cases section expanded |
| `Rewrite for a mobile-first audience` | Target users, stories, and metrics updated |
| `Make the success metrics more aggressive` | Targets and timeframes tightened |
| `Add risks around GDPR compliance` | Risks section updated with regulatory context |

---

*Built by Juan Navarrete — PM portfolio project demonstrating Agentic AI and Generative AI product engineering skills.*
