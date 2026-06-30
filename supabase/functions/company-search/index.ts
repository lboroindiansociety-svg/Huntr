import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secretKey = Deno.env.get("LOGO_DEV_SECRET_KEY");
  if (!secretKey) {
    return new Response(JSON.stringify({ error: "LOGO_DEV_SECRET_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const res = await fetch(
    `https://api.logo.dev/search?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );

  if (!res.ok) {
    return new Response(JSON.stringify([]), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
