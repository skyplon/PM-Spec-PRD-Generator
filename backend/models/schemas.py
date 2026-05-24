"""
Pydantic schemas for the PM Spec Generator.
Every LLM output is typed — zero unstructured string responses.
"""
from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field


class AcceptanceCriteria(BaseModel):
    given: str = Field(description="The context/precondition")
    when: str  = Field(description="The action taken")
    then: str  = Field(description="The expected outcome")


class UserStory(BaseModel):
    persona:  str = Field(description="The user type this story is for")
    goal:     str = Field(description="What the user wants to accomplish")
    benefit:  str = Field(description="Why they want it — the underlying motivation")
    criteria: list[AcceptanceCriteria] = Field(description="2-3 acceptance criteria in Given/When/Then format")
    priority: Literal["must-have", "should-have", "nice-to-have"] = "must-have"


class SuccessMetric(BaseModel):
    metric:    str = Field(description="Name of the metric")
    baseline:  str = Field(description="Current state or starting point")
    target:    str = Field(description="Goal to hit within the timeframe")
    timeframe: str = Field(description="When this target should be achieved")


class CompetitorInsight(BaseModel):
    competitor: str
    how_they_solve_it: str
    gap_or_opportunity: str


class PRDSpec(BaseModel):
    title:               str
    tldr:                str = Field(description="One sentence summary of the feature")
    problem_statement:   str = Field(description="The user problem being solved, 2-3 sentences")
    goal:                str = Field(description="What success looks like for the product and user")
    target_users:        list[str] = Field(description="2-3 specific user personas")
    user_stories:        list[UserStory] = Field(description="3-5 user stories covering core use cases")
    success_metrics:     list[SuccessMetric] = Field(description="3-4 measurable success metrics")
    out_of_scope:        list[str] = Field(description="Explicit things NOT included in this feature")
    edge_cases:          list[str] = Field(description="4-6 edge cases the engineering team must handle")
    risks:               list[str] = Field(description="3-4 risks to delivery or adoption")
    competitive_context: list[CompetitorInsight] = Field(default_factory=list)
    open_questions:      list[str] = Field(description="Unresolved questions that need answers before build")


class GenerateRequest(BaseModel):
    idea:         str  = Field(description="The feature idea in 1-3 sentences")
    product_name: str  = Field(default="Our Product")
    domain:       str  = Field(default="SaaS")
    user_type:    str  = Field(default="end users")
    search_web:   bool = Field(default=True, description="Whether to run web research first")


class RefineRequest(BaseModel):
    prd:         PRDSpec
    instruction: str = Field(description="How to change or improve the spec")
