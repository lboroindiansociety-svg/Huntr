import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createUserSupabaseClient } from "../_shared/userClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type TrackrFilters = {
  region: string;
  industry: string;
  season: string;
  type: string;
};

const DEFAULT_FILTERS: TrackrFilters = {
  region: "UK",
  industry: "Tech",
  season: "2027",
  type: "graduate-programmes",
};

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function mapProgramme(programme: Record<string, unknown>, filters: TrackrFilters, userId: string) {
  const company = (programme.company ?? {}) as Record<string, unknown>;
  const careersSite = (company.careersSite as string | null) ?? null;
  const link = (programme.url as string | null) ?? careersSite;

  return {
    user_id: userId,
    trackr_id: programme.id as string,
    name: programme.name as string,
    company_id: (programme.companyId as string | null) ?? (company.id as string | null) ?? null,
    company_name: (company.name as string) ?? "Unknown",
    company_domain: extractDomain(link),
    job_url: (programme.url as string | null) ?? null,
    careers_site: careersSite,
    region: filters.region,
    industry: filters.industry,
    season: filters.season,
    programme_type: filters.type,
    categories: (programme.categories as string[] | null) ?? [],
    opening_date: (programme.openingDate as string | null) ?? null,
    closing_date: (programme.closingDate as string | null) ?? null,
    last_year_opening: (programme.lastYearOpening as string | null) ?? null,
    cv_required: (programme.cv as boolean | null) ?? null,
    cover_letter: (programme.coverLetter as string | null) ?? null,
    written_answers: (programme.writtenAnswers as string | null) ?? null,
    sponsors_visa: (company.sponsorsVisa as string | null) ?? null,
    raw: programme,
    synced_at: new Date().toISOString(),
  };
}

function isActiveProgramme(programme: Record<string, unknown>): boolean {
  return !!(programme.url && programme.openingDate);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = await createUserSupabaseClient(req);
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { supabase, user } = auth;
    const body = await req.json().catch(() => ({}));
    const filters: TrackrFilters = {
      region: typeof body.region === "string" ? body.region : DEFAULT_FILTERS.region,
      industry: typeof body.industry === "string" ? body.industry : DEFAULT_FILTERS.industry,
      season: typeof body.season === "string" ? body.season : DEFAULT_FILTERS.season,
      type: typeof body.type === "string" ? body.type : DEFAULT_FILTERS.type,
    };

    const params = new URLSearchParams({
      region: filters.region,
      industry: filters.industry,
      season: filters.season,
      type: filters.type,
    });

    const trackrRes = await fetch(`https://api.the-trackr.com/programmes?${params}`);
    if (!trackrRes.ok) {
      return new Response(JSON.stringify({ error: `Trackr API returned ${trackrRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const programmes = await trackrRes.json();
    if (!Array.isArray(programmes)) {
      return new Response(JSON.stringify({ error: "Unexpected Trackr API response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = programmes
      .filter((p: Record<string, unknown>) => isActiveProgramme(p))
      .map((p: Record<string, unknown>) => mapProgramme(p, filters, user.id));

    let added = 0;
    if (rows.length > 0) {
      const { data: existing, error: existingError } = await supabase
        .from("trackr_programmes")
        .select("trackr_id")
        .eq("user_id", user.id);
      if (existingError) {
        return new Response(JSON.stringify({ error: existingError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existingIds = new Set((existing || []).map((row) => row.trackr_id));
      const newRows = rows.filter((row) => !existingIds.has(row.trackr_id));
      added = newRows.length;

      if (newRows.length > 0) {
        const { error } = await supabase.from("trackr_programmes").insert(newRows);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { count, error: countError } = await supabase
      .from("trackr_programmes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("region", filters.region)
      .eq("industry", filters.industry)
      .eq("season", filters.season)
      .eq("programme_type", filters.type);
    if (countError) {
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastSyncedAt = new Date().toISOString();
    const { error: metaError } = await supabase.from("trackr_sync_meta").upsert({
      user_id: user.id,
      region: filters.region,
      industry: filters.industry,
      season: filters.season,
      programme_type: filters.type,
      last_synced_at: lastSyncedAt,
      programme_count: count ?? 0,
    }, { onConflict: "user_id" });
    if (metaError) {
      return new Response(JSON.stringify({ error: metaError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      synced: rows.length,
      added,
      total: count ?? 0,
      lastSyncedAt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync Trackr programmes";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
