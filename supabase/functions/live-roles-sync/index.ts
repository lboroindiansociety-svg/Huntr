import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createUserSupabaseClient } from "../_shared/userClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAD_TECH_QUERIES = [
  "graduate software engineer",
  "graduate developer",
  "new grad software",
  "early careers software engineer",
  "graduate software developer",
];

const REED_GRAD_TECH_QUERIES = [
  "(software OR developer OR programmer) AND graduate",
  "graduate AND (software engineer OR software developer)",
  '("new grad" OR graduate) AND software',
  "early careers AND (software OR developer OR programmer)",
  'graduate AND (frontend OR backend OR fullstack OR devops OR "data engineer")',
];

const REED_EXCLUDE_TITLE =
  /\b(electronics|electrical|mechanical|civil|architectural|lighting|structural|manufacturing|hvac|automotive|chemical|biomedical|project design|quantity survey|welding|fabrication|plumbing|surveyor|nurse|nursing|teaching|teacher|care assistant)\b/i;

const REED_INCLUDE_TITLE =
  /\b(software|developer|programmer|devops|dev ops|frontend|front-end|backend|back-end|fullstack|full[- ]stack|web developer|mobile developer|cloud engineer|cybersecurity|cyber security|data engineer|machine learning|ml engineer|ai engineer|platform engineer|site reliability|\bsre\b|\.net developer|java developer|python developer|javascript|typescript|react developer|ios developer|android developer|it graduate|tech graduate|software engineer|software developer|technology|computing|informatics|\bit\b|\btech\b)\b/i;

function isRelevantReedTechRole(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return false;
  if (REED_EXCLUDE_TITLE.test(trimmed)) return false;
  return REED_INCLUDE_TITLE.test(trimmed);
}

const ADZUNA_MAX_PAGES = 2;
const ADZUNA_RESULTS_PER_PAGE = 50;

function parsePostedDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  const dotNet = trimmed.match(/\/Date\((\d+)\)\//);
  if (dotNet) {
    const d = new Date(Number(dotNet[1]));
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const uk = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (uk) {
    const [, day, month, year] = uk;
    const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "GBP",
): string | null {
  if (min == null && max == null) return null;
  const safeCurrency = currency?.trim() || "GBP";
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: safeCurrency,
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `£${Math.round(n).toLocaleString("en-GB")}`;
    }
  };
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max!);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapAdzunaJob(job: Record<string, unknown>, query: string, userId: string) {
  const redirectUrl = job.redirect_url as string | undefined;
  const title = job.title as string | undefined;
  if (!redirectUrl || !title) return null;
  const company = job.company as Record<string, unknown> | undefined;
  const location = job.location as Record<string, unknown> | undefined;
  return {
    user_id: userId,
    external_id: String(job.id),
    source: "adzuna",
    company_name: (company?.display_name as string)?.trim() || "Unknown",
    company_domain: null,
    role: title.trim(),
    job_url: redirectUrl,
    location: (location?.display_name as string) ?? null,
    salary: formatSalary(job.salary_min as number, job.salary_max as number),
    description: ((job.description as string) ?? "").slice(0, 500) || null,
    posted_at: parsePostedDate((job.created as string) ?? null),
    search_query: query,
    synced_at: new Date().toISOString(),
  };
}

function mapReedJob(job: Record<string, unknown>, query: string, userId: string) {
  const jobUrl = job.jobUrl as string | undefined;
  const jobTitle = job.jobTitle as string | undefined;
  if (!jobUrl || !jobTitle) return null;
  if (!isRelevantReedTechRole(jobTitle)) return null;
  const description = ((job.jobDescription as string) ?? "")
    .replace(/<[^>]+>/g, " ")
    .slice(0, 500);
  return {
    user_id: userId,
    external_id: String(job.jobId),
    source: "reed",
    company_name: ((job.employerName as string) ?? "Unknown").trim(),
    company_domain: null,
    role: jobTitle.trim(),
    job_url: jobUrl,
    location: (job.locationName as string) ?? null,
    salary: formatSalary(
      job.minimumSalary as number,
      job.maximumSalary as number,
      (job.currency as string) || "GBP",
    ),
    description: description || null,
    posted_at: parsePostedDate((job.date as string) ?? null),
    search_query: query,
    synced_at: new Date().toISOString(),
  };
}

async function fetchAdzunaPage(
  appId: string,
  appKey: string,
  query: string,
  page: number,
) {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    category: "it-jobs",
    results_per_page: String(ADZUNA_RESULTS_PER_PAGE),
  });
  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${params}`);
  if (!res.ok) throw new Error(`Adzuna API returned ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function fetchReedSearch(apiKey: string, query: string) {
  const params = new URLSearchParams({
    keywords: query,
    graduate: "true",
    resultsToTake: "100",
  });
  const auth = btoa(`${apiKey}:`);
  const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Reed API returned ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : [];
}

async function appendRolesForSource(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  source: "adzuna" | "reed",
  rows: Record<string, unknown>[],
) {
  let added = 0;

  if (rows.length > 0) {
    const { data: existing, error: existingError } = await supabase
      .from("discover_roles")
      .select("external_id")
      .eq("user_id", userId)
      .eq("source", source);
    if (existingError) throw new Error(existingError.message);

    const existingIds = new Set((existing || []).map((row) => row.external_id));
    const newRows = rows.filter((row) => !existingIds.has(row.external_id as string));
    added = newRows.length;

    if (newRows.length > 0) {
      const { error } = await supabase.from("discover_roles").insert(newRows);
      if (error) throw new Error(error.message);
    }
  }

  const { count, error: countError } = await supabase
    .from("discover_roles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", source);
  if (countError) throw new Error(countError.message);

  const lastSyncedAt = new Date().toISOString();
  const { error: metaError } = await supabase.from("discover_roles_sync_meta").upsert({
    user_id: userId,
    source,
    last_synced_at: lastSyncedAt,
    role_count: count ?? 0,
  }, { onConflict: "user_id,source" });
  if (metaError) throw new Error(metaError.message);

  return { synced: rows.length, added, total: count ?? 0, lastSyncedAt };
}

async function syncAdzuna(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  appKey: string,
  userId: string,
) {
  const byKey = new Map<string, Record<string, unknown>>();

  for (const query of GRAD_TECH_QUERIES) {
    for (let page = 1; page <= ADZUNA_MAX_PAGES; page++) {
      const results = await fetchAdzunaPage(appId, appKey, query, page);
      if (results.length === 0) break;
      for (const job of results) {
        const row = mapAdzunaJob(job, query, userId);
        if (row) byKey.set(`${row.source}:${row.external_id}`, row);
      }
      if (results.length < ADZUNA_RESULTS_PER_PAGE) break;
    }
    await sleep(250);
  }

  return appendRolesForSource(supabase, userId, "adzuna", [...byKey.values()]);
}

async function syncReed(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  userId: string,
) {
  const byKey = new Map<string, Record<string, unknown>>();

  for (const query of REED_GRAD_TECH_QUERIES) {
    const results = await fetchReedSearch(apiKey, query);
    for (const job of results) {
      const row = mapReedJob(job, query, userId);
      if (row) byKey.set(`${row.source}:${row.external_id}`, row);
    }
    await sleep(250);
  }

  return appendRolesForSource(supabase, userId, "reed", [...byKey.values()]);
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

    const adzunaAppId = Deno.env.get("ADZUNA_APP_ID");
    const adzunaAppKey = Deno.env.get("ADZUNA_APP_KEY");
    const reedApiKey = Deno.env.get("REED_API_KEY");

    if (!adzunaAppId || !adzunaAppKey) {
      return new Response(JSON.stringify({ error: "ADZUNA_APP_ID and ADZUNA_APP_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!reedApiKey) {
      return new Response(JSON.stringify({ error: "REED_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { supabase, user } = auth;
    const adzuna = await syncAdzuna(supabase, adzunaAppId, adzunaAppKey, user.id);
    const reed = await syncReed(supabase, reedApiKey, user.id);

    return new Response(JSON.stringify({ adzuna, reed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync live roles";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
