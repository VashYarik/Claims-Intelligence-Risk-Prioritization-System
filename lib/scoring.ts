export interface ClaimData {
  id: string;
  amount: number;
  incidentType: string;
  date: string;
  claimant: string;
  adjuster: string;
  policy: string;
  location: string;
  witnesses: number | null;
  priorClaims: number;
  notes: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  explanation: string;
  anomalyFlag: string | null;
  status: "Under Review" | "Pending" | "Approved";
}

export function evaluateRisk(claim: ClaimData): RiskAnalysis {
  let score = 0;
  const reasons: string[] = [];
  let anomaly: string | null = null;

  // 1. Amount factor
  if (claim.amount > 100000) {
    score += 40;
    reasons.push("Claim amount unusually high.");
  } else if (claim.amount > 20000) {
    score += 20;
    reasons.push("Claim amount exceeds typical thresholds.");
  }

  // 2. Prior claims factor
  if (claim.priorClaims >= 3) {
    score += 35;
    reasons.push(`Claimant has a high history of prior claims (${claim.priorClaims}).`);
    anomaly = "Frequent claimant history detected.";
  } else if (claim.priorClaims === 2) {
    score += 20;
    reasons.push("Claimant has multiple prior claims.");
  }

  // 3. Witnesses factor
  if (claim.witnesses === 0 && claim.amount > 10000) {
    score += 15;
    reasons.push("No witnesses reported for a high-value claim.");
  }

  // 4. Keyword analysis in notes (fraud indicators)
  const lowerNotes = (claim.notes || "").toLowerCase();
  if (lowerNotes.includes("fraud") || lowerNotes.includes("inconsistency") || lowerNotes.includes("disputed")) {
    score += 30;
    reasons.push("Adjuster notes contain risk-indicating keywords.");
    anomaly = anomaly || "Possible fraudulent activity noted.";
  }

  // Cap score at 100
  score = Math.min(Math.max(score, 0), 100);

  // Determine level
  let level: RiskAnalysis["riskLevel"] = "low";
  let status: RiskAnalysis["status"] = "Approved";
  
  if (score >= 80) {
    level = "critical";
    status = "Under Review";
  } else if (score >= 60) {
    level = "high";
    status = "Pending";
  } else if (score >= 40) {
    level = "medium";
    status = "Pending";
  }

  // Fallback explanation if none provided
  if (reasons.length === 0) {
    reasons.push("No significant risk factors identified. Claim appears routine.");
  }

  return {
    riskScore: score,
    riskLevel: level,
    explanation: reasons.join(" "),
    anomalyFlag: anomaly,
    status
  };
}
