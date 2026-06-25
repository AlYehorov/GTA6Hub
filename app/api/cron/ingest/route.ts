import { NextResponse } from "next/server";
import { ingestAndDraftWorkflow } from "@/lib/workflows/ingest-and-draft-workflow";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === secret) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function handleIngest() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin is not configured" },
      { status: 503 }
    );
  }

  const startedAt = Date.now();
  const result = await ingestAndDraftWorkflow.runFullCycle();

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    ingested: result.ingested,
    skipped: result.skipped,
    draftsCreated: result.draftsCreated,
    errors: result.errors,
    aiProvider: process.env.OPENAI_API_KEY?.trim() ? "openai" : "mock",
  });
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return handleIngest();
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return handleIngest();
}
