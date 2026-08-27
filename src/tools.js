import { provchartFetch } from "./client.js";

const CHART_TYPES = [
  "line", "area", "bar", "stackedbar", "hbar",
  "scatter", "combo", "gauge", "stat",
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
      "Series list. Use points[] for line/area/bar; value for gauge (0–100). Optional per-series type for combo.",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        color: { type: "string", description: "Hex color e.g. #8b7bff" },
        points: { type: "array", items: { type: "number" } },
        value: { type: "number", description: "Gauge value 0–100" },
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
  theme: {
    type: "string",
    description: "dark | light | midnight",
  },
  label: { type: "string", description: "Gauge center label" },
  size: { type: "number", description: "Gauge size px" },
  thickness: { type: "number", description: "Gauge ring thickness" },
  width: { type: "number", description: "SVG width" },
  height: { type: "number", description: "SVG height" },
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
      "Return short integration instructions for ProvChart (inject HTML/CSS, SVG usage, runtime). No API call.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "inject | svg | runtime | errors | overview",
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
    runtime: `Optional: npm i provchart-runtime or CDN. Set window.ProvChartRuntimeConfig then load script. Enhances [data-provchart] HTML only; skips pure SVG when excludeSvg:true.`,
    errors: `INVALID_API_KEY | MONTHLY_LIMIT_REACHED | SUBSCRIPTION_REQUIRED. Free tier has limited gens/month. HTML and SVG share quota.`,
  };
  return map[topic] || map.overview;
}
