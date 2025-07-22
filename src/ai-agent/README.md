# AI Agent for Dashboard Deelmobiliteit

## Overview

The AI agent helps users navigate the Dashboard Deelmobiliteit by understanding their queries and asking for missing required information before executing commands.

## How it works

### Required Fields Handling

The AI agent checks the schema files to determine which fields are required for each view:

- **Verhuringen**: `eindtijd`, `periode`, `plaats`, `herkomstbestemming`
- **Aanbod**: `datetime`, `plaats`
- **Ontwikkeling**: `periode`, `plaats`

### Conversation Flow

1. **User asks a question** (e.g., "Verhuringen afgelopen week")
2. **AI extracts known information** from the query
3. **AI checks for missing required fields**
4. **If fields are missing**: AI asks for the first missing field
5. **User responds** with the missing information
6. **AI continues asking** until all required fields are provided
7. **When complete**: AI generates the appropriate commands

### Example Conversation

```
User: "Verhuringen afgelopen week"
AI: "Ik heb nog wat informatie nodig om je vraag te beantwoorden.

Voor welke plaats wil je de data bekijken?"

User: "Amsterdam"
AI: "Ik heb nog wat informatie nodig om je vraag te beantwoorden.

Wil je de herkomst of bestemming van de verhuringen bekijken?"

User: "herkomst"
AI: "Ik heb nog wat informatie nodig om je vraag te beantwoorden.

Voor welke eindtijd wil je de data bekijken? (bijv. "nu", "gisteren 15:00")"

User: "nu"
AI: "Perfect! Ik heb alle benodigde informatie. Hier zijn de commando's:

SHOWVIEW verhuringen
SETFILTER periode 1w
SETFILTER plaats amsterdam
SETFILTER herkomstbestemming herkomst
SETFILTER eindtijd now"
```

## Files

- `mockLlmService.ts` - Main service that handles conversation logic
- `LLMPrompt.tsx` - Prompt template for external LLM (if used)
- `schemas/` - Schema definitions for each view
- `test-mock-service.ts` - Simple test file

## Usage

The AI agent is integrated into the `AICard` component and can be accessed through the map interface. Users can type natural language queries and the agent will guide them through providing all necessary information. 