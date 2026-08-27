const BASE = process.env.PROVCHART_API_BASE || "https://provchart-api.devtem.org";

export async function provchartFetch(path, body, apiKey) {
  const key = apiKey || process.env.PROVCHART_API_KEY;
  if (!key) {
    throw new Error(
      "Missing API key. Set PROVCHART_API_KEY or pass apiKey in the tool arguments."
    );
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = data.error || data.code || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}
