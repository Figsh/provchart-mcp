import { provchartFetch } from "./client.js";

const CHART_TYPES = [
  "line", "area", "bar", "stackedbar", "hbar",
  "scatter", "combo", "gauge",
];

/** Shared JSON-schema-ish properties for chart config */
const chartProperties = {
  type: {
    type: "string",
    description: `Chart type: ${CHART_TYPES.join(", ")}`,
  },
  series: {
    type: "array",
    description:
      "Series list. Use points[] for line/area/bar; value for gauge. Optional per-series type for combo.",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        color: { type: "string", description: "Hex color e.g. #8b7bff" },
        points: { type: "array", items: { type: "number" } },
        value: {
          type: "number",
          description:
            "Gauge value. Scaled against the chart's min/max (defaults to 0-100 if neither is set).",
        },
        type: { type: "string", description: "combo only: line|bar|area|scatter" },
        radius: { type: "number", description: "scatter point radius" },
      },
      required: ["name", "color"],
    },
  },
  axisX: {
    type: "array",
    items: { type: "string" },
    description: "X-axis labels",
  },
  axisY: {
    type: "boolean",
    description:
      "Show numeric Y-axis labels (default true). Set false to hide them.",
  },
  min: {
    type: "number",
    description:
      "Fix the low end of the value range (line/area/bar/scatter/hbar/gauge). Omit to auto-scale from the data (defaults to 0 unless values go negative).",
  },
  max: {
    type: "number",
    description:
      "Fix the high end of the value range. Omit to auto-scale from the highest value in the data (or the highest stacked total when stacked is true).",
  },
  stacked: {
    type: "boolean",
    description: "For type: bar — stack series instead of grouping them side by side.",
  },
  legend: {
    type: "boolean",
    description: "Show the series legend (default true).",
  },
  grid: {
    type: "boolean",
    description: "Show background gridlines (default true).",
  },
  theme: {
    type: "string",
    description: "dark | light | midnight",
  },
  label: { type: "string", description: "Gauge center label" },
  size: { type: "number", description: "Gauge size px" },
  thickness: { type: "number", description: "Gauge ring thickness" },
  width: { type: "number", description: "Chart width (SVG default 640, max 1200)" },
  height: { type: "number", description: "Chart height (SVG default 320, max 800)" },
  apiKey: {
    type: "string",
    description: "Optional override; prefer PROVCHART_API_KEY env",
  },
};

function pickPayload(args) {
  const {
    apiKey, // strip
    ...rest
  } = args;
  return { payload: rest, apiKey };
}

export const tools = [
  {
    name: "provchart_generate",
    description:
      "Generate a ProvChart pure CSS chart (HTML + CSS). No Chart.js. Inject css into a <style> tag and html into a container. Prefer this for web pages and dashboards.",
    inputSchema: {
      type: "object",
      properties: chartProperties,
      required: ["type", "series"],
    },
  },
  {
    name: "provchart_generate_svg",
    description:
      "Generate a ProvChart SVG chart for README/docs/Markdown. Returns svg markup and optional dataUri. Prefer committing .svg files over huge data URIs on GitHub.",
    inputSchema: {
      type: "object",
      properties: chartProperties,
      required: ["type", "series"],
    },
  },
  {
    name: "provchart_explain",
    description:
      "Return short integration instructions for ProvChart (inject HTML/CSS, SVG usage, runtime, ranges). No API call.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "inject | svg | runtime | errors | ranges | overview",
        },
      },
    },
  },
];

export async function handleTool(name, args = {}) {
  if (name === "provchart_explain") {
    return { content: [{ type: "text", text: explain(args.topic || "overview") }] };
  }

  const { payload, apiKey } = pickPayload(args);

  if (name === "provchart_generate") {
    const data = await provchartFetch("/api/v1/generate", payload, apiKey);
    const text = [
      "ProvChart HTML/CSS generate OK.",
      "",
      "### Inject",
      "1. Append data.css to a <style> tag",
      "2. Set container.innerHTML = data.html",
      "3. Optional: provchart-runtime for tooltips (not required for paint)",
      "",
      "### html",
      "```html",
      data.html || "",
      "```",
      "",
      "### css",
      "```css",
      data.css || "",
      "```",
    ].join("\n");
    return {
      content: [{ type: "text", text }],
      // structured payload for clients that support it
      structuredContent: {
        success: true,
        html: data.html,
        css: data.css,
      },
    };
  }

  if (name === "provchart_generate_svg") {
    const data = await provchartFetch("/api/v1/generate-svg", payload, apiKey);
    const text = [
      "ProvChart SVG generate OK.",
      "",
      "Prefer writing svg to a file and using ![](./chart.svg) in Markdown.",
      "",
      "### svg",
      "```svg",
      data.svg || "",
      "```",
      data.dataUri ? `\n### dataUri (truncated)\n${String(data.dataUri).slice(0, 120)}…\n` : "",
    ].join("\n");
    return {
      content: [{ type: "text", text }],
      structuredContent: {
        success: true,
        svg: data.svg,
        dataUri: data.dataUri,
      },
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

function explain(topic) {
  const map = {
    overview: `ProvChart compiles JSON → HTML+CSS or SVG. No chart-library runtime required for paint.
API: https://provchart-api.devtem.org
Keys: https://chart.devtem.org/dashboard
Site: https://chart.devtem.org`,
    inject: `After provchart_generate:
document.getElementById('chart').innerHTML = html;
const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);`,
    svg: `After provchart_generate_svg: write svg to disk; in README use ![alt](./charts/x.svg). Avoid huge data URIs on GitHub when possible.`,
    runtime: `Optional: npm i provchart-runtime or CDN (<script src="https://cdn.jsdelivr.net/npm/provchart-runtime@1.2.0/dist/provchart-runtime.min.js" defer></script>) . Set window.ProvChartRuntimeConfig then load script. Enhances [data-provchart] HTML only; skips pure SVG when excludeSvg:true.`,
    ranges: `Values are NOT locked to 0-100. Omit min/max and the chart auto-scales from your data (min defaults to 0 unless values go negative; max is the highest value, or the highest stacked total when stacked:true). Pass min/max to pin the axis yourself. axisY:false hides the numeric Y-axis labels.`,
    errors: `INVALID_API_KEY | MONTHLY_LIMIT_REACHED | SUBSCRIPTION_REQUIRED. Free tier has limited gens/month. HTML and SVG share quota.`,
  };
  return map[topic] || map.overview;
}
