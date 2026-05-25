import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 12, color: "var(--primary-light)" }}>{payload[0]?.value?.toFixed(1)}%</p>
    </div>
  );
};

export default function SkillChart({ resumeSkills = [], requiredSkills = [], atsBreakdown = {} }) {
  // Radar data from ATS breakdown
  const radarData = Object.entries(atsBreakdown).map(([key, val]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    score: typeof val === "object" ? (val.score || 0) : 0,
    fullMark: 25,
  }));

  // Bar data: matched vs missing skills
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const barData = requiredSkills.slice(0, 10).map((skill) => ({
    skill: skill.length > 12 ? skill.slice(0, 12) + "…" : skill,
    matched: resumeSet.has(skill.toLowerCase()) ? 100 : 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {radarData.length > 0 && (
        <div id="pdf-radar-chart">
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>ATS Score Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--polar-grid, rgba(0,0,0,0.1))" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "var(--text-muted)", fontSize: 9 }} domain={[0, 25]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {barData.length > 0 && (
        <div id="pdf-bar-chart">
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>Required Skills Coverage</p>
          <ResponsiveContainer width="100%" height={Math.max(barData.length * 32, 120)}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="skill" tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="matched" radius={[0, 4, 4, 0]}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.skill}
                    fill={entry.matched === 100 ? "var(--accent-green)" : "rgba(239,68,68,0.4)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {radarData.length === 0 && barData.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 32 }}>No skill data available</p>
      )}
    </div>
  );
}
