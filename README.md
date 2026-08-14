# PRAVAAH BUILD PACK

This package contains the complete PRD/specification set for building and testing the Pravaah prototype.

The `pravaah/specs/` directory is intended to be copied into the project root and used as the source-of-truth for a coding agent.

Start with:

`pravaah/specs/00_MASTER_PROMPT.md`
# Terminal 1
cd /Users/cashify/Downloads/Pravaah_Master_Specs/pravaah/engine
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2
cd /Users/cashify/Downloads/Pravaah_Master_Specs/pravaah/dashboard
npm run dev