---
name: obsidian-void
description: Use this skill whenever the user wants to interact with their Obsidian vault called Void. Triggers include: reading notes, searching the vault, creating or editing notes, listing vault structure, writing daily notes, logging what the user did today, summarizing session actions, or any mention of Obsidian, vault, poznamky, denik, denni poznamka, Void vault. Also trigger when finishing a task session and the user wants to log progress. Proactively offer to log to daily note when actions were taken during a session.
---

# Obsidian Void Skill

Claude's guide for working with Megatron's Obsidian vault via the obsidian-void-mcp MCP server.

## Vault Info

- Vault root: C:\Users\Megatron\Documents\Void
- MCP server name: obsidian-void-mcp
- Language: Czech preferred, English accepted
- User: Megatron

## Folder Structure

```
Void/
 06 - DailyNotes/
    {YEAR}/
       {MM}/
          {DD-MM-YYYY}.md
 ... other vault folders
```

## Daily Notes

- Path pattern: 06 - DailyNotes/{YYYY}/{MM}/{DD-MM-YYYY}.md
- Example: 06 - DailyNotes/2026/03/03-03-2026.md
- Filename format: DD-MM-YYYY.md (day first, zero-padded)
- Frontmatter on creation:
  date: YYYY-MM-DD
  type: daily
- Header: # DD.MM.YYYY
- Entries appended under ## HH:MM timestamp headings

## Available MCP Tools

- list_vault: Browse vault structure
- read_note: Read any note (vault-relative path)
- search_notes: Full-text search across vault
- create_note: Create a new note
- edit_note: Append / prepend / replace content in existing note
- daily_note: Log to today's daily note (auto-creates if missing)

All paths are vault-relative, e.g.: 06 - DailyNotes/2026/03/03-03-2026.md

## Behavior Guidelines

### Language
- Write note content in Czech by default
- Switch to English only if user writes in English or explicitly asks

### Daily Notes
- When user asks to log what they did, use daily_note tool
- When finishing a session where actions were taken, proactively offer to log a summary
- Format entries with bullet points, include: what was done, what was created/changed, decisions made

Example daily note entry:
```
## 14:32

Pracoval jsem na MCP serveru pro Obsidian vault.

- Vytvoren vlastni MCP server (server.js) s nastroji pro cteni, zapis a hledani poznamek
- Nastavena struktura dennich poznamek
- Nainstalovan skill pro Claude
```

### Creating Notes
- Check if note exists first before creating
- Use descriptive Czech filenames for Czech content
- Add frontmatter for structured notes

### Editing
- Prefer append mode to preserve existing content
- Use replace only when explicitly asked
- Confirm with user before using replace on important notes

### Searching
- Search with both Czech and English terms when unsure of language
- Narrow with subfolder param when you know the area

## Common Tasks

"Zapiš co jsem dnes delal" / "Log what I did today"
  Use daily_note with a summary of the session

"Najdi poznamku o X" / "Find note about X"
  Use search_notes with keywords

"Ukaz strukturu vaultu" / "Show vault structure"
  Use list_vault

"Vytvor poznamku o X" / "Create note about X"
  Use create_note with appropriate path and content

"Pridej do poznamky X" / "Add to note X"
  Use edit_note with mode append

"Prectis mi poznamku X" / "Read note X"
  Use read_note
