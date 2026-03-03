#!/usr/bin/env node
/**
 * Obsidian Vault MCP Server
 * Vault: C:\Users\Megatron\Documents\Void
 * Daily Notes: 06 - DailyNotes\{YEAR}\{MM}\{DD-MM-YYYY}.md
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// ── Config ────────────────────────────────────────────────────────────────────
const VAULT_PATH = "C:\\Users\\Megatron\\Documents\\Void";
const DAILY_NOTES_BASE = path.join(VAULT_PATH, "06 - DailyNotes");

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTodayParts() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  return { dd, mm, yyyy };
}

function getDailyNotePath() {
  const { dd, mm, yyyy } = getTodayParts();
  const filename = `${dd}-${mm}-${yyyy}.md`;
  return path.join(DAILY_NOTES_BASE, yyyy, mm, filename);
}

function resolvePath(relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(VAULT_PATH, relativePath);
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function listFilesRecursive(dir, base = dir) {
  let results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);
    if (entry.isDirectory()) {
      results.push({ type: "folder", path: rel });
      results = results.concat(await listFilesRecursive(full, base));
    } else {
      results.push({ type: "file", path: rel });
    }
  }
  return results;
}

async function searchInFile(filePath, query) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const matches = [];
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matches.push({ line: i + 1, text: line.trim() });
      }
    });
    return matches;
  } catch {
    return [];
  }
}

// ── Tool Definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_vault",
    description: "List folder/file structure of the Obsidian vault. Optionally limit to a subfolder.",
    inputSchema: {
      type: "object",
      properties: {
        subfolder: {
          type: "string",
          description: "Optional vault-relative subfolder (e.g. '06 - DailyNotes'). Defaults to vault root.",
        },
      },
    },
  },
  {
    name: "read_note",
    description: "Read full content of a note by vault-relative path.",
    inputSchema: {
      type: "object",
      required: ["note_path"],
      properties: {
        note_path: {
          type: "string",
          description: "Vault-relative path, e.g. '06 - DailyNotes/2026/03/29-03-2026.md'",
        },
      },
    },
  },
  {
    name: "search_notes",
    description: "Full-text search across all markdown files in the vault (or a subfolder).",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Text to search for" },
        subfolder: {
          type: "string",
          description: "Optional vault-relative subfolder to limit search.",
        },
      },
    },
  },
  {
    name: "create_note",
    description: "Create a new note at a vault-relative path. Fails if note already exists.",
    inputSchema: {
      type: "object",
      required: ["note_path", "content"],
      properties: {
        note_path: { type: "string", description: "Vault-relative path for the new note." },
        content: { type: "string", description: "Full markdown content of the note." },
      },
    },
  },
  {
    name: "edit_note",
    description: "Edit an existing note. Modes: append, prepend, or replace.",
    inputSchema: {
      type: "object",
      required: ["note_path", "content", "mode"],
      properties: {
        note_path: { type: "string", description: "Vault-relative path to the note." },
        content: { type: "string", description: "Markdown content to write." },
        mode: {
          type: "string",
          enum: ["append", "prepend", "replace"],
          description: "'append' adds to end, 'prepend' adds to start, 'replace' overwrites entirely.",
        },
      },
    },
  },
  {
    name: "daily_note",
    description:
      "Create or append to today's daily note. Auto-resolves path: 06 - DailyNotes/{YEAR}/{MM}/{DD-MM-YYYY}.md. Use to log what user did, actions taken, summaries, reflections.",
    inputSchema: {
      type: "object",
      required: ["content"],
      properties: {
        content: {
          type: "string",
          description: "Markdown content to add. Will be appended under a timestamp heading.",
        },
        create_if_missing: {
          type: "boolean",
          description: "Create daily note with header if it doesn't exist yet (default: true).",
        },
      },
    },
  },
];

// ── Tool Handlers ─────────────────────────────────────────────────────────────

async function handleListVault({ subfolder } = {}) {
  const root = subfolder ? resolvePath(subfolder) : VAULT_PATH;
  const files = await listFilesRecursive(root, root);
  if (files.length === 0) return `No files found in: ${root}`;
  const lines = files.map((f) => {
    const depth = f.path.split(path.sep).length - 1;
    const icon = f.type === "folder" ? "📁" : "📄";
    return `${"  ".repeat(depth)}${icon} ${path.basename(f.path)}`;
  });
  return `Vault structure (${subfolder || "root"}):\n\n${lines.join("\n")}`;
}

async function handleReadNote({ note_path }) {
  const full = resolvePath(note_path);
  try {
    const content = await fs.readFile(full, "utf-8");
    return `# ${path.basename(note_path)}\n\n${content}`;
  } catch (e) {
    throw new Error(`Cannot read note: ${note_path}\n${e.message}`);
  }
}

async function handleSearchNotes({ query, subfolder }) {
  const root = subfolder ? resolvePath(subfolder) : VAULT_PATH;
  const all = await listFilesRecursive(root, root);
  const mdFiles = all.filter((f) => f.type === "file" && f.path.endsWith(".md"));

  const results = [];
  for (const f of mdFiles) {
    const full = path.join(root, f.path);
    const matches = await searchInFile(full, query);
    if (matches.length > 0) results.push({ file: f.path, matches });
  }

  if (results.length === 0) return `Žádné výsledky pro: "${query}"`;

  return results
    .map((r) => `📄 ${r.file}\n` + r.matches.map((m) => `  L${m.line}: ${m.text}`).join("\n"))
    .join("\n\n");
}

async function handleCreateNote({ note_path, content }) {
  const full = resolvePath(note_path);
  try {
    await fs.access(full);
    throw new Error(`Poznámka již existuje: ${note_path}. Použij edit_note pro úpravu.`);
  } catch (e) {
    if (e.message.includes("Poznámka již existuje")) throw e;
  }
  await ensureDir(full);
  await fs.writeFile(full, content, "utf-8");
  return `✅ Poznámka vytvořena: ${note_path}`;
}

async function handleEditNote({ note_path, content, mode }) {
  const full = resolvePath(note_path);
  let existing = "";
  try {
    existing = await fs.readFile(full, "utf-8");
  } catch {
    throw new Error(`Poznámka nenalezena: ${note_path}`);
  }

  let final;
  if (mode === "append") final = existing.trimEnd() + "\n\n" + content;
  else if (mode === "prepend") final = content + "\n\n" + existing.trimStart();
  else final = content;

  await fs.writeFile(full, final, "utf-8");
  return `✅ Poznámka upravena (${mode}): ${note_path}`;
}

async function handleDailyNote({ content, create_if_missing = true }) {
  const notePath = getDailyNotePath();
  const { dd, mm, yyyy } = getTodayParts();

  await ensureDir(notePath);

  let exists = true;
  try {
    await fs.access(notePath);
  } catch {
    exists = false;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  const timestampHeading = `\n\n## ${timeStr}\n\n`;

  if (!exists) {
    if (!create_if_missing) throw new Error(`Dnešní deník neexistuje: ${notePath}`);
    const header = `---\ndate: ${yyyy}-${mm}-${dd}\ntype: daily\n---\n\n# ${dd}.${mm}.${yyyy}\n`;
    await fs.writeFile(notePath, header + timestampHeading + content, "utf-8");
    return `✅ Denní poznámka vytvořena: 06 - DailyNotes/${yyyy}/${mm}/${dd}-${mm}-${yyyy}.md`;
  } else {
    const existing = await fs.readFile(notePath, "utf-8");
    await fs.writeFile(notePath, existing.trimEnd() + timestampHeading + content, "utf-8");
    return `✅ Záznam přidán do denního deníku: 06 - DailyNotes/${yyyy}/${mm}/${dd}-${mm}-${yyyy}.md`;
  }
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "obsidian-void-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result;
    switch (name) {
      case "list_vault":   result = await handleListVault(args);   break;
      case "read_note":    result = await handleReadNote(args);    break;
      case "search_notes": result = await handleSearchNotes(args); break;
      case "create_note":  result = await handleCreateNote(args);  break;
      case "edit_note":    result = await handleEditNote(args);    break;
      case "daily_note":   result = await handleDailyNote(args);   break;
      default: throw new Error(`Neznámý nástroj: ${name}`);
    }
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    return { content: [{ type: "text", text: `❌ Chyba: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Obsidian Void MCP server běží...");
