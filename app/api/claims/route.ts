import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const stmt = db.prepare("SELECT * FROM claims ORDER BY riskScore DESC");
    const rows = stmt.all();

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}
