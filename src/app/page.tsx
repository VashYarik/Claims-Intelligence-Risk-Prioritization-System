"use client";

import { useState, useMemo, useEffect } from "react";

const fmt = (n: number) => "$" + n.toLocaleString();
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Interpolates green(0) → yellow(50) → red(100)
function scoreColor(score: number) {
  const t = score / 100;
  let r, g, b;
  if (t <= 0.5) {
    // green → yellow
    const s = t / 0.5;
    r = Math.round(80 + s * (220 - 80));
    g = Math.round(200 - s * (200 - 200));
    b = Math.round(80 - s * 80);
  } else {
    // yellow → red
    const s = (t - 0.5) / 0.5;
    r = Math.round(220 + s * (210 - 220));
    g = Math.round(200 - s * 200);
    b = 0;
  }
  return `rgb(${r},${g},${b})`;
}

function ScoreRing({ score }: { score: number }) {
  const R = 18, cx = 22, cy = 22, sw = 3;
  const circ = 2 * Math.PI * R;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e1e1e" strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={R} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace", fontSize: 12, fontWeight: 600, color,
      }}>{score}</span>
    </div>
  );
}

const RISK_FILTERS = ["all", "critical", "high", "medium", "low"];
const STATUS_FILTERS = ["all", "Under Review", "Pending", "Approved"];

export default function App() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"date" | "riskScore" | "amount" | "id">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/claims")
      .then(res => res.json())
      .then(data => {
        setClaims(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch claims:", err);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const result = claims.filter(c => {
      if (filterRisk !== "all" && c.riskLevel !== filterRisk) return false;
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = c.id?.toLowerCase().includes(q) ||
          c.claimant?.toLowerCase().includes(q) ||
          c.incidentType?.toLowerCase().includes(q) ||
          c.policy?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (sortField === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [claims, filterRisk, filterStatus, searchQuery, sortField, sortOrder]);

  const toggle = (id: string) => setOpen(o => o === id ? null : id);

  const Cell = ({ label, value, mono }: any) => (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #1c1c1c" }}>
      <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#999", fontFamily: mono ? "monospace" : "inherit" }}>{value ?? "—"}</div>
    </div>
  );

  const Btn = ({ label, active, onClick }: any) => (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer",
      fontFamily: "monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
      color: active ? "#e8e8e4" : "#3a3a3a",
      padding: "4px 10px", borderRadius: 2,
      borderBottom: active ? "1px solid #e8e8e4" : "1px solid transparent",
      transition: "color 0.12s",
    }}>{label}</button>
  );

  return (
    <>
      <style precedence="default" href="claims-queue-styles">{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0d; color: #e8e8e4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #222; }
        .row-hdr { cursor: pointer; transition: background 0.1s; }
        .row-hdr:hover { background: #111; }
        .expand { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1); }
        .expand.open { max-height: 700px; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 100px" }}>

        {/* Page header */}
        <div style={{ padding: "48px 0 32px", borderBottom: "1px solid #1c1c1c" }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#3a3a3a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Claims Queue</span>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 300, letterSpacing: "-0.5px", color: "#e8e8e4" }}>
            {loading ? "Loading..." : `${filtered.length} claims`}
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 0", borderBottom: "1px solid #1c1c1c" }}>
          <div style={{ display: "flex", gap: 16, width: "100%" }}>
            <input 
              type="text" 
              placeholder="Search claims (ID, Claimant, Type, Policy)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: "#0a0a0a", border: "1px solid #2e2e2e", color: "#e8e8e4",
                padding: "8px 12px", borderRadius: "2px", flex: 1,
                fontFamily: "monospace", fontSize: 13, outline: "none", transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "#666"}
              onBlur={e => e.target.style.borderColor = "#2e2e2e"}
            />
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444", textTransform: "uppercase" }}>Risk</span>
              {RISK_FILTERS.map(r => <Btn key={r} label={r === "all" ? "All" : r} active={filterRisk === r} onClick={() => setFilterRisk(r)} />)}
            </div>
            <div style={{ width: 1, height: 16, background: "#1c1c1c" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444", textTransform: "uppercase" }}>Status</span>
              {STATUS_FILTERS.map(s => <Btn key={s} label={s === "all" ? "All" : s} active={filterStatus === s} onClick={() => setFilterStatus(s)} />)}
            </div>
          </div>
        </div>

        {/* Column heads */}
        <div style={{ display: "grid", gridTemplateColumns: "56px 88px 1fr 110px 90px", padding: "10px 0", borderBottom: "1px solid #1c1c1c", gap: 16 }}>
          {[
            { label: "Score", field: "riskScore" },
            { label: "ID", field: "id" },
            { label: "Type", field: null },
            { label: "Amount", field: "amount" },
            { label: "Date", field: "date" }
          ].map(h => (
            <div 
              key={h.label} 
              onClick={() => {
                if (!h.field) return;
                if (sortField === h.field) setSortOrder(o => o === "asc" ? "desc" : "asc");
                else { setSortField(h.field as any); setSortOrder("desc"); }
              }}
              style={{ 
                fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                color: h.field === sortField ? "#888" : "#2e2e2e",
                cursor: h.field ? "pointer" : "default",
                display: "flex", alignItems: "center", gap: 4, userSelect: "none"
              }}
            >
              <span 
                style={{ transition: "color 0.2s" }} 
                onMouseEnter={e => { if (h.field) e.currentTarget.style.color = "#888" }} 
                onMouseLeave={e => { if (h.field) e.currentTarget.style.color = h.field === sortField ? "#888" : "#2e2e2e" }}
              >
                {h.label}
              </span>
              {h.field === sortField && (
                <span style={{ fontSize: 9, color: "#666" }}>{sortOrder === "desc" ? "↓" : "↑"}</span>
              )}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", fontFamily: "monospace", fontSize: 12, color: "#2e2e2e", textAlign: "center" }}>Fetching data...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 0", fontFamily: "monospace", fontSize: 12, color: "#2e2e2e", textAlign: "center" }}>No results.</div>
        ) : null}

        {!loading && filtered.map((c, i) => {
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ borderBottom: "1px solid #1c1c1c" }}>
              {/* Row */}
              <div
                className="row-hdr"
                onClick={() => toggle(c.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 88px 1fr 110px 90px",
                  padding: "10px 0",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <ScoreRing score={c.riskScore} />
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#3d3d3d" }}>{c.id}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "#aaa" }}>{c.incidentType}</span>
                  {c.anomalyFlag && (
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#444", letterSpacing: "0.04em" }}>⚑</span>
                  )}
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#777" }}>{fmt(c.amount)}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#3d3d3d" }}>{fmtDate(c.date)}</span>
              </div>

              {/* Expanded */}
              <div className={`expand${isOpen ? " open" : ""}`}>
                <div style={{ paddingBottom: 24 }}>
                  {/* 3-col grid for detail fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 32px", marginBottom: 4 }}>
                    <Cell label="Claimant" value={c.claimant} />
                    <Cell label="Policy" value={c.policy} mono />
                    <Cell label="Adjuster" value={c.adjuster} />
                    <Cell label="Location" value={c.location} />
                    <Cell label="Prior Claims" value={c.priorClaims} mono />
                    <Cell label="Witnesses" value={c.witnesses} mono />
                    <Cell label="Status" value={c.status} />
                    <Cell label="Risk Level" value={c.riskLevel.charAt(0).toUpperCase() + c.riskLevel.slice(1)} mono />
                    <Cell label="Incident Date" value={fmtDate(c.date)} mono />
                  </div>

                  {/* Assessment */}
                  <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid #1c1c1c" }}>
                    <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Assessment</div>
                    <p style={{ fontSize: 13, color: "#888", lineHeight: 1.75, maxWidth: 620 }}>{c.explanation}</p>
                  </div>

                  {/* Anomaly */}
                  {c.anomalyFlag && (
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1c1c1c" }}>
                      <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>⚑ Anomaly</div>
                      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.75 }}>{c.anomalyFlag}</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1c1c1c" }}>
                    <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Notes</div>
                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.75 }}>{c.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
