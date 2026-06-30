import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SYSTEM_PROMPT = `You extract structured job or internship posting data from web page text.
Return JSON only with these fields:
- company_name: string
- role: string (job title)
- location: exactly one of "remote", "on-site", "hybrid"
- location_place: string (city/region if known, else empty string)
- salary: string (compensation if mentioned, else empty string)
- deadline: string (ISO date YYYY-MM-DD if mentioned, else empty string)
- notes: string (2-3 sentence summary of role and key requirements)
- company_domain: string (company website domain like "stripe.com", else empty string)

Use empty strings for unknown fields. Be accurate — do not invent details.`;

const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseGeminiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body.error?.message) return body.error.message;
  } catch { /* ignore */ }

  if (response.status === 503) {
    return "Gemini is temporarily overloaded. Wait a few seconds and try again.";
  }
  if (response.status === 429) {
    return "Gemini rate limit hit. Wait a minute or check your API quota at aistudio.google.com.";
  }
  if (response.status === 401 || response.status === 403) {
    return "Invalid Gemini API key. Check GEMINI_API_KEY in your .env file.";
  }

  return `AI extraction failed (${response.status})`;
}

async function callGemini(
  apiKey: string,
  userContent: string,
  tools?: Array<{ url_context: Record<string, never> }>,
): Promise<string> {
  let lastError = "Gemini is temporarily unavailable. Wait a moment and try again.";

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userContent.slice(0, 12000) }] }],
            ...(tools ? { tools } : {}),
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.error?.message) {
          lastError = data.error.message;
          break;
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) return content;

        lastError = "AI returned an empty response";
        break;
      }

      lastError = await parseGeminiError(response);

      if ((response.status === 503 || response.status === 429) && attempt === 0) {
        await sleep(1500);
        continue;
      }

      if (response.status === 503 || response.status === 429) {
        break;
      }

      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
}

function browserHeaders(url: string): Record<string, string> {
  let origin = url;
  try {
    origin = new URL(url).origin;
  } catch { /* keep url */ }

  return {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Referer: `${origin}/`,
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
}

async function fetchJson(url: string): Promise<unknown | null> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchKnownAtsText(url: string): Promise<string | null> {
  const greenhouse = url.match(
    /(?:boards|job-boards)\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i,
  );
  if (greenhouse) {
    const [, board, jobId] = greenhouse;
    const job = await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${jobId}`,
    ) as Record<string, unknown> | null;
    if (job) {
      const location = (job.location as { name?: string })?.name || "";
      const content = stripHtml(String(job.content || ""));
      return [
        `Title: ${job.title || ""}`,
        `Company: ${job.company_name || board}`,
        `Location: ${location}`,
        "",
        content,
      ].join("\n");
    }
  }

  const lever = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/i);
  if (lever) {
    const [, company, postingId] = lever;
    const job = await fetchJson(
      `https://api.lever.co/v0/postings/${company}/${postingId}`,
    ) as Record<string, unknown> | null;
    if (job) {
      const categories = job.categories as Record<string, string> | undefined;
      const location = categories?.location || "";
      const description = String(
        job.descriptionPlain || stripHtml(String(job.description || "")),
      );
      return [
        `Title: ${job.text || ""}`,
        `Company: ${company}`,
        `Location: ${location}`,
        `Team: ${categories?.team || ""}`,
        "",
        description,
      ].join("\n");
    }
  }

  return null;
}

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: browserHeaders(url),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Could not fetch job page (${res.status})`);
  }

  const html = await res.text();
  const text = stripHtml(html);

  if (text.length < 80) {
    throw new Error("Could not extract enough text from this page");
  }

  return text;
}

async function fetchViaJinaReader(url: string, jinaApiKey?: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-Return-Format": "markdown",
  };
  if (jinaApiKey) {
    headers.Authorization = `Bearer ${jinaApiKey}`;
  }

  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers,
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Reader proxy failed (${res.status})`);
  }

  const text = (await res.text()).trim();
  if (text.length < 80) {
    throw new Error("Reader proxy returned empty content");
  }

  return text.slice(0, 20000);
}

async function resolvePageText(url: string, jinaApiKey?: string): Promise<string> {
  try {
    return await fetchViaJinaReader(url, jinaApiKey);
  } catch {
    const atsText = await fetchKnownAtsText(url);
    if (atsText && atsText.length >= 50) return atsText;

    return fetchPageText(url);
  }
}

async function extractViaGeminiUrlContext(
  apiKey: string,
  url: string,
): Promise<string> {
  return callGemini(
    apiKey,
    `Read the job posting at this URL and extract the structured fields:\n${url}`,
    [{ url_context: {} }],
  );
}

function normalizeLocation(value: unknown): string {
  const loc = String(value || "").toLowerCase().trim();
  if (loc === "onsite" || loc === "on site" || loc === "in-office") {
    return "on-site";
  }
  if (loc === "hybrid" || loc === "flex") return "hybrid";
  if (loc === "remote" || loc === "work from home" || loc === "wfh") {
    return "remote";
  }
  return "remote";
}

function normalizeDeadline(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}

function mapParsedFields(parsed: Record<string, unknown>, url: string) {
  return {
    company_name: String(parsed.company_name || "").trim(),
    company_domain: String(parsed.company_domain || "").trim(),
    role: String(parsed.role || "").trim(),
    location: normalizeLocation(parsed.location),
    location_place: String(parsed.location_place || "").trim(),
    salary: String(parsed.salary || "").trim(),
    deadline: normalizeDeadline(parsed.deadline),
    notes: String(parsed.notes || "").trim(),
    job_url: url || "",
  };
}

async function extractJobDetails({
  url,
  pageText,
  apiKey,
  jinaApiKey,
}: {
  url?: string;
  pageText?: string;
  apiKey: string;
  jinaApiKey?: string;
}) {
  let content: string;

  if (pageText?.trim()) {
    const text = pageText.trim();
    if (text.length < 50) {
      throw new Error("Not enough job posting content to analyze");
    }
    content = await callGemini(
      apiKey,
      `Job posting URL: ${url || "unknown"}\n\nPage content:\n${text}`,
    );
  } else if (url) {
    let text: string;

    try {
      text = await resolvePageText(url, jinaApiKey);
    } catch {
      try {
        content = await extractViaGeminiUrlContext(apiKey, url);
        return mapParsedFields(JSON.parse(content), url);
      } catch {
        throw new Error(
          'Could not read this job page automatically. Expand "Paste page text instead" below, copy the job description from your browser, and try again.',
        );
      }
    }

    content = await callGemini(
      apiKey,
      `Job posting URL: ${url}\n\nPage content:\n${text}`,
    );
  } else {
    throw new Error("Provide a job posting URL or page text");
  }

  return mapParsedFields(JSON.parse(content), url || "");
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

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const pageText = typeof body.pageText === "string"
      ? body.pageText.trim()
      : "";

    if (!url && !pageText) {
      return new Response(
        JSON.stringify({ error: "Provide a job posting URL or page text" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (url) {
      try {
        new URL(url);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const result = await extractJobDetails({
      url,
      pageText,
      apiKey,
      jinaApiKey: Deno.env.get("JINA_API_KEY") || undefined,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse job posting";
    return new Response(JSON.stringify({ error: message }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
