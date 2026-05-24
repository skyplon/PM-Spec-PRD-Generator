"""
ResearchAgent
─────────────
Uses Claude's native web_search tool to pull competitive context
before drafting the PRD.

Returns a plain string summary — used as context in the spec writer prompt.
"""

import os
import logging
import anthropic

logger = logging.getLogger(__name__)
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

WEB_SEARCH_TOOL = {
    "type": "web_search_20250305",
    "name": "web_search",
}

SYSTEM = """You are a product research analyst. Given a feature idea, 
search the web to find how competitors solve this problem today.
Focus on: specific product features, pricing approaches, user complaints on review sites, 
and gaps in existing solutions.
Be concise and factual. Cite the product names you found."""


def research_agent(idea: str, domain: str) -> str:
    """
    Runs web search to gather competitive context for the feature idea.
    Returns a plain text summary to inject into the spec writer prompt.
    """
    logger.info("[ResearchAgent] Starting web search")

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=SYSTEM,
            tools=[WEB_SEARCH_TOOL],
            messages=[{
                "role": "user",
                "content": f"""Research how existing {domain} products handle this feature:

"{idea}"

Search for:
1. How the top 2-3 competitors implement this
2. What users complain about in existing solutions (check G2, Reddit, app store reviews)
3. Any obvious gap or differentiation opportunity

Return a brief summary (max 300 words) with specific product names and findings."""
            }]
        )

        # Extract text content from response — may include tool use blocks
        text_parts = []
        for block in response.content:
            if hasattr(block, "text"):
                text_parts.append(block.text)

        summary = "\n".join(text_parts).strip()
        logger.info(f"[ResearchAgent] Got {len(summary)} chars of research")
        return summary or "No competitive research available."

    except Exception as e:
        logger.warning(f"[ResearchAgent] Web search failed: {e}")
        return f"Web research unavailable: {e}"
