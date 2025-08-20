// netlify/functions/tweets.ts
import type { Handler } from "@netlify/functions";

const ASSETDASH = "https://screener-api.assetdash.com/moby_screener/tokens/tweets";

export const handler: Handler = async (event) => {
  try {
    const token_address = event.queryStringParameters?.token_address || "";
    const compact = event.queryStringParameters?.compact ?? "false";

    if (!token_address) {
      return {
        statusCode: 400,
        headers: cors(),
        body: JSON.stringify({ error: "token_address is required" }),
      };
    }

    const url = new URL(ASSETDASH);
    url.searchParams.set("token_address", token_address);
    url.searchParams.set("compact", String(compact));

    const upstream = await fetch(url.toString(), { method: "GET" });
    const text = await upstream.text(); // pass-through body as-is

    return {
      statusCode: upstream.status,
      headers: {
        ...cors(),
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        // friendly cache (tune as desired)
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
      body: text,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: "Upstream fetch failed", detail: String(err?.message || err) }),
    };
  }
};

function cors() {
  // lock to your site in production if you prefer
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
}
