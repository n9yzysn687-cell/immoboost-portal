import { NextResponse } from "next/server";
import { buildMissionKit, type MarketCode } from "../../../lib/daily-engine";
import { searchWorkflows } from "../../../lib/workflows";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const situation = String(body?.situation ?? "").trim();
    const market = String(body?.market ?? "BE") as MarketCode;

    if (!situation) return NextResponse.json({ error: "Décrivez une mission Agent Daily." }, { status: 400 });

    const workflow = searchWorkflows(situation, "all")[0];
    const kit = buildMissionKit(situation, market, workflow);
    const creditsDebited = kit.engine === "quality" ? 3 : 1;

    return NextResponse.json({ kit, billing: { success: true, creditsDebited, debitedAfterSuccess: true } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Mission non finalisée, aucun crédit débité." }, { status: 500 });
  }
}
