const ASSETDASH = "https://screener-api.assetdash.com/moby_screener/tokens/tweets";

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders(),
    });
  }

  try {
    const url = new URL(request.url);
    const token_address = url.searchParams.get("token_address") || "";
    const compact = url.searchParams.get("compact") ?? "false";

    if (!token_address) {
      return new Response(JSON.stringify({ error: "token_address is required" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const upstreamUrl = new URL(ASSETDASH);
    upstreamUrl.searchParams.set("token_address", token_address);
    upstreamUrl.searchParams.set("compact", String(compact));

    const upstream = await fetch(upstreamUrl.toString(), { method: "GET" });
    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ 
        error: "Upstream fetch failed", 
        detail: String(err?.message || err) 
      }), 
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}