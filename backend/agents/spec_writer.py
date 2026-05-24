"""
SpecWriterAgent
───────────────
Generates a full typed PRD from the feature idea + research context.

Uses Instructor to enforce the PRDSpec Pydantic schema —
every field is required and validated before returning.
"""

import os
import logging
import anthropic
import instructor
from ..models.schemas import PRDSpec, GenerateRequest

logger = logging.getLogger(__name__)

anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
client = instructor.from_anthropic(anthropic_client)

SYSTEM = """You are a senior product manager at a top-tier tech company.
You write PRDs that are precise, actionable, and developer-ready.

Rules:
- User stories follow the format: As a [persona], I want [goal] so that [benefit]
- Acceptance criteria are in Given/When/Then format — specific and testable
- Success metrics have a baseline, a target, and a timeframe
- Edge cases are technical enough for engineers to act on
- Out of scope items prevent scope creep — be explicit
- Open questions block the build until answered — flag real unknowns
- Never invent features beyond what was asked — stay focused on the stated idea"""


def spec_writer_agent(request: GenerateRequest, research_context: str) -> PRDSpec:
    """
    Generates a complete PRD from the feature idea and research context.
    Returns a fully typed PRDSpec object enforced by Instructor.
    """
    logger.info("[SpecWriterAgent] Generating PRD")

    competitive_section = ""
    if research_context and "unavailable" not in research_context.lower():
        competitive_section = f"""
<competitive_research>
{research_context}
</competitive_research>

Use this research to populate the competitive_context field and inform edge cases and risks.
"""

    prd: PRDSpec = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=SYSTEM,
        messages=[{
            "role": "user",
            "content": f"""Write a complete PRD for this feature:

<idea>{request.idea}</idea>

<context>
Product: {request.product_name}
Domain: {request.domain}
Primary users: {request.user_type}
</context>
{competitive_section}

Output limits to stay within token budget:
- Exactly 3 user stories (not more)
- Exactly 2 acceptance criteria per user story
- Exactly 3 success metrics
- Exactly 4 edge cases
- Exactly 3 risks
- Exactly 3 open questions
- Exactly 4 out of scope items

Be specific and developer-ready. Use measurable criteria. No vague language."""
        }],
        response_model=PRDSpec,
    )

    logger.info(f"[SpecWriterAgent] Generated PRD: '{prd.title}' with {len(prd.user_stories)} stories")
    return prd


def refine_spec_agent(prd: PRDSpec, instruction: str) -> PRDSpec:
    """
    Refines an existing PRD based on a natural language instruction.
    Passes the full PRD content so Claude can make targeted edits.
    """
    import json
    logger.info(f"[SpecWriterAgent] Refining PRD: '{instruction[:60]}'")

    # Serialize the full PRD as readable JSON so Claude sees all content
    full_prd = prd.model_dump()

    refined: PRDSpec = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        system=SYSTEM,
        messages=[{
            "role": "user",
            "content": f"""Here is a complete existing PRD in JSON format:

<existing_prd>
{json.dumps(full_prd, indent=2)}
</existing_prd>

Refinement instruction: {instruction}

Apply the instruction to the PRD above and return the complete updated PRD.
- Keep all sections that are NOT mentioned in the instruction exactly as they are
- Only modify the sections relevant to the instruction
- Maintain the same number of user stories, metrics, and edge cases unless the instruction explicitly asks to add/remove
- Same output limits apply: 3 user stories, 2 AC each, 3 metrics, 4 edge cases, 3 risks, 3 open questions"""
        }],
        response_model=PRDSpec,
    )

    logger.info(f"[SpecWriterAgent] Refinement complete: '{refined.title}'")
    return refined
