# provchart-mcp

MCP server for [ProvChart](https://chart.devtem.org) — generate pure-CSS charts (HTML/CSS or SVG) from any MCP-aware agent. No Chart.js, no client-side chart runtime required to paint.

## What it does

Three tools, exposed over stdio:

| Tool | Returns | Use for |
|------|---------|---------|
| `provchart_generate` | `html` + `css` | Web pages, dashboards, anywhere you can inject markup |
| `provchart_generate_svg` | `svg` + `dataUri` | READMEs, docs, Markdown, static exports |
| `provchart_explain` | Integration notes | No API call — quick reference for injection, ranges, runtime, errors |

Charts compile to real CSS (`clip-path`, custom properties) or real `<svg>` markup. Nothing runs client-side unless you opt into the optional [provchart-runtime](https://github.com/fscss-ttr/provchart-runtime) for hover tooltips and reveal animations.

## Install

```bash
npm install -g provchart-mcp
```

Or run it directly without installing, via `npx` (see config below).

## Setup

You'll need an API key from the [ProvChart dashboard](https://chart.devtem.org/dashboard) → Developer API.

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Other MCP clients

Any client that supports stdio servers works the same way — point it at `provchart-mcp` (or `node src/index.js` if running from a local clone) and set `PROVCHART_API_KEY` in the environment.

You can also pass `apiKey` per-call as a tool argument instead of using the env var, if a given call needs to use a different key.

## Usage

Once connected, just ask your agent for a chart:

> Generate a line chart of monthly signups: Jan 120, Feb 450, Mar 3200, Apr 8900, May 15400. Give me the SVG for my README.

The agent calls `provchart_generate_svg`, gets back real SVG markup, and can write it straight to a file.

### Chart types

`line`, `area`, `bar`, `stackedbar`, `hbar`, `scatter`, `combo`, `gauge`.

### Value ranges

Charts auto-scale to your data by default — no need to pre-normalize anything to 0–100. Pass `min` / `max` if you want the axis pinned instead. Ask the server directly:

> Use provchart_explain with topic "ranges"

### Example payload

```json
{
  "type": "bar",
  "series": [
    { "name": "2025", "color": "#8b7bff", "points": [40, 55, 48, 70] },
    { "name": "2026", "color": "#4fd8c4", "points": [35, 50, 62, 58] }
  ],
  "axisX": ["Q1", "Q2", "Q3", "Q4"],
  "theme": "midnight"
}
```

## Errors

| Code | Meaning |
|------|---------|
| `INVALID_API_KEY` | Key missing, revoked, or malformed |
| `SUBSCRIPTION_REQUIRED` | Plan inactive |
| `MONTHLY_LIMIT_REACHED` | Plan quota used up for the month |

HTML and SVG generation share the same monthly quota.

## Links

- [ProvChart](https://chart.devtem.org)
- [Docs](https://chart.devtem.org/docs)
- [Dashboard / API keys](https://chart.devtem.org/dashboard)
- [Issues](https://github.com/Figsh/provchart-mcp/issues)

## License

MIT
