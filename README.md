# provchart-mcp

**MCP server for [ProvChart](https://chart.devtem.org)** — agents generate **pure CSS charts** (HTML + CSS) or **SVG** for README/docs.

No Chart.js. No client chart runtime required for paint. Same JSON your dashboard uses.

| | |
|---|---|
| **npm** | `provchart-mcp` (publish when ready) |
| **API** | [chart.devtem.org/docs](https://chart.devtem.org/docs) |
| **Keys** | [Dashboard → Developer API](https://chart.devtem.org/dashboard) |
| **License** | MIT |

---

## What it does

| Tool | Output |
|------|--------|
| `provchart_generate` | HTML + CSS for web pages |
| `provchart_generate_svg` | SVG (+ data URI) for Markdown / docs |
| `provchart_explain` | Short inject / SVG / runtime / error notes (no API call) |

Agents call these instead of inventing Chart.js snippets.

---

## Requirements

- **Node.js 18+** (native `fetch`)
- **ProvChart API key** — free signed-up accounts include limited monthly test gens

```bash
export PROVCHART_API_KEY=pc_live_xxxxxxxx
```

Never commit real keys. Prefer env / MCP `env` config.

---

## Install & run

### From source (this repo)

```bash
cd provchart-mcp
npm install
export PROVCHART_API_KEY=pc_live_xxxxxxxx
node src/index.js
```

The process speaks **MCP over stdio** (stays quiet until a client connects).

### After publish

```bash
npx -y provchart-mcp
```

---

## Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "provchart": {
      "command": "node",
      "args": ["/absolute/path/to/provchart-mcp/src/index.js"],
      "env": {
        "PROVCHART_API_KEY": "pc_live_xxxxxxxx"
      }
    }
  }
}
```

Or with npx (once published):

```json
{
  "mcpServers": {
    "provchart": {
      "command": "npx",
      "args": ["-y", "provchart-mcp"],
      "env": {
        "PROVCHART_API_KEY": "pc_live_xxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Cursor

`mcp.json` (project or global):

```json
{
  "mcpServers": {
    "provchart": {
      "command": "node",
      "args": ["/absolute/path/to/provchart-mcp/src/index.js"],
      "env": {
        "PROVCHART_API_KEY": "pc_live_xxxxxxxx"
      }
    }
  }
}
```

---

## Example prompts

- *Use `provchart_generate` for a midnight theme area chart: Traffic vs Signups, Mon–Sun.*
- *Generate an SVG line chart of p50/p95 latency for a GitHub README.*
- *Explain how to inject ProvChart HTML/CSS without a chart library.*

### Example tool args (`provchart_generate`)

```json
{
  "type": "area",
  "theme": "midnight",
  "series": [
    { "name": "Traffic", "color": "#4fd8c4", "points": [30, 45, 40, 60, 55, 70, 65] },
    { "name": "Signups", "color": "#f0a860", "points": [8, 12, 11, 18, 16, 22, 20] }
  ],
  "axisX": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
}
```

Inject the returned CSS into a `<style>` tag and the HTML into a container. Optional: [provchart-runtime](https://github.com/fscss-ttr/provchart-runtime) for tooltips — **not required for paint**.

---

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `PROVCHART_API_KEY` | Yes* | API key (`X-API-Key`) |
| `PROVCHART_API_BASE` | No | Default `https://provchart-api.devtem.org` |

\*Or pass `apiKey` in the tool arguments (env preferred).

---

## Errors

| Code / message | Meaning |
|----------------|---------|
| Missing API key | Set `PROVCHART_API_KEY` |
| `INVALID_API_KEY` | Bad or revoked key |
| `MONTHLY_LIMIT_REACHED` | Quota exhausted (HTML + SVG share the pool) |
| `SUBSCRIPTION_REQUIRED` | Plan does not include this capability |

---

## Project layout

```text
provchart-mcp/
  package.json
  README.md
  src/
    index.js    # MCP stdio server
    client.js   # ProvChart HTTP helper
    tools.js    # Tool schemas + handlers
```

---

## Related

- [ProvChart](https://chart.devtem.org) — product & builder  
- [Live demo](https://chart.devtem.org/demo) — multi-chart API batch  
- [Developer API](https://chart.devtem.org/docs)  
- [provchart-runtime](https://github.com/fscss-ttr/provchart-runtime) — optional HTML enhancements  
- [st-core.fscss](https://github.com/fscss-ttr/st-core.fscss) — open pure-CSS roots  

---
