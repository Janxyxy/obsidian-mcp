# Obsidian Void MCP - Setup Guide

Toto je tvůj vlastní MCP server pro Obsidian vault + skill pro Claudea.

---

## Krok 1: Vytvoř složku pro server

Otevři PowerShell a spusť:

```powershell
mkdir C:\Users\Megatron\obsidian-mcp
```

Zkopíruj `server.js` a `package.json` do této složky.

---

## Krok 2: Nainstaluj závislosti

```powershell
cd C:\Users\Megatron\obsidian-mcp
npm install
```

---

## Krok 3: Otestuj server

```powershell
node server.js
```

Měl by se vypsat: `Obsidian Void MCP server běží...`
Zastav ho pomocí Ctrl+C.

---

## Krok 4: Přidej server do Claude.ai

1. Otevři **Claude.ai** → klikni na svůj profilový obrázek → **Settings**
2. Přejdi do sekce **Integrations** nebo **MCP Servers**
3. Přidej nový server s těmito údaji:

```
Name:    obsidian-void-mcp
Command: node
Args:    C:\Users\Megatron\obsidian-mcp\server.js
```

Nebo pokud Claude.ai požaduje JSON konfiguraci:

```json
{
  "mcpServers": {
    "obsidian-void-mcp": {
      "command": "node",
      "args": ["C:\\Users\\Megatron\\obsidian-mcp\\server.js"]
    }
  }
}
```

---

## Krok 5: Nainstaluj skill

1. V Claude.ai přejdi do **Settings → Skills** (nebo Projects)
2. Nahraj soubor `SKILL.md` jako nový skill
3. Pojmenuj ho: `obsidian-void`

---

## Krok 6: Otestuj

V chatu s Claudem zkus napsat:

- `"Ukaž mi strukturu mého vaultu"`
- `"Zapiš do deníku, že jsem nastavil MCP server"`
- `"Hledej ve vaultu slovo 'projekt'"`

---

## Dostupné nástroje

| Nástroj | Co dělá |
|---|---|
| `list_vault` | Zobrazí strukturu vaultu |
| `read_note` | Přečte obsah poznámky |
| `search_notes` | Hledá text ve všech poznámkách |
| `create_note` | Vytvoří novou poznámku |
| `edit_note` | Upraví existující poznámku (append/prepend/replace) |
| `daily_note` | Zapíše do dnešního deníku (vytvoří ho pokud neexistuje) |

---

## Formát denních poznámek

```
06 - DailyNotes/
  2026/
    03/
      03-03-2026.md
```

Každá poznámka se otevře takto:

```markdown
---
date: 2026-03-03
type: daily
---

# 03.03.2026

## 14:32

Co jsem dnes dělal...
```

---

## Problémy?

- **"Cannot find module"** - spusť `npm install` znovu ve složce serveru
- **"Permission denied"** - spusť PowerShell jako správce
- **Server se nespustí** - zkontroluj, že máš Node.js 18+ (`node --version`)
