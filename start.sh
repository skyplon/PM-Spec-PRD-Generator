#!/bin/bash
cd ~/AI_Prototypes/pm-spec-generator/backend
source venv/bin/activate
cd ~/AI_Prototypes/pm-spec-generator
uvicorn backend.api.main:app --reload --port 8001
