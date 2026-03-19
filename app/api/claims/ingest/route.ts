import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { evaluateRisk } from "../../../../lib/scoring";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Ensure we handle array or single object
    const claims: any[] = Array.isArray(data) ? data : [data];
    const results: any[] = [];

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO claims (
        id, riskScore, riskLevel, amount, incidentType, date, status, 
        explanation, anomalyFlag, claimant, adjuster, policy, location, 
        witnesses, priorClaims, notes
      ) VALUES (
        @id, @riskScore, @riskLevel, @amount, @incidentType, @date, @status,
        @explanation, @anomalyFlag, @claimant, @adjuster, @policy, @location,
        @witnesses, @priorClaims, @notes
      )
    `);

    // Run within transaction
    const transaction = db.transaction((claimsToInsert: any[]) => {
      for (const claim of claimsToInsert) {
        // Evaluate risk
        const risk = evaluateRisk(claim);
        
        const claimObj = {
          id: claim.id,
          amount: claim.amount,
          incidentType: claim.incidentType,
          date: claim.date,
          claimant: claim.claimant,
          adjuster: claim.adjuster,
          policy: claim.policy,
          location: claim.location,
          witnesses: claim.witnesses ?? null,
          priorClaims: claim.priorClaims || 0,
          notes: claim.notes || "",
          
          // computed risk
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          explanation: claim.explanation || risk.explanation, // allow override
          anomalyFlag: claim.anomalyFlag || risk.anomalyFlag,
          status: claim.status || risk.status,
        };

        insertStmt.run(claimObj);
        results.push(claimObj);
      }
    });

    transaction(claims);

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error("Failed to ingest claims:", error);
    return NextResponse.json({ error: "Failed to ingest claims" }, { status: 500 });
  }
}
