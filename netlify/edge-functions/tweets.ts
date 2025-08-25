import type { Config } from '@netlify/edge-functions';

const ASSETDASH = "https://screener-api.assetdash.com/moby_screener/tokens/tweets";

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const token_address = url.searchParams.get('token_address');
    const compact = url.searchParams.get('compact') ?? 'false';

    // Handle OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: cors(),
      });
    }

    if (!token_address) {
      return new Response(
        JSON.stringify({ error: "token_address is required" }),
        {
          status: 400,
          headers: {
            ...cors(),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const upstreamUrl = new URL(ASSETDASH);
    upstreamUrl.searchParams.set("token_address", token_address);
    upstreamUrl.searchParams.set("compact", String(compact));

    const upstream = await fetch(upstreamUrl.toString(), { 
      method: "GET",
      // Add timeout for edge function
      signal: AbortSignal.timeout(8000),
    });
    
    const text = await upstream.text(); // pass-through body as-is

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...cors(),
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        // Friendly cache (tune as desired)
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
        headers: {
          ...cors(),
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

function cors() {
  // Lock to your site in production if you prefer
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const config: Config = {
  path: "/api/tweets",
};
