import { NextResponse } from "next/server";
import claims from "./claims.json";

export async function GET() {
  try {
    // Optionally sort by riskScore descending as before, or just return as is.
    // The JSON dump can just be returned directly if it's already sorted.
    // Let's sort it just in case.
    const sortedClaims = [...claims].sort((a: any, b: any) => b.riskScore - a.riskScore);
    return NextResponse.json(sortedClaims);
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}
