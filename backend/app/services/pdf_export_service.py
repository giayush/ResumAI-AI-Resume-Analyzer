"""
pdf_export_service.py
─────────────────────
Generates a professional PDF analysis report using ReportLab.
"""

import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ── Color Palette ────────────────────────────────────────────────────────────
PRIMARY = colors.HexColor("#6C63FF")
SUCCESS = colors.HexColor("#10B981")
WARNING = colors.HexColor("#F59E0B")
DANGER = colors.HexColor("#EF4444")
DARK = colors.HexColor("#1E1B4B")
LIGHT_BG = colors.HexColor("#F8F7FF")
GRAY = colors.HexColor("#6B7280")


def generate_report_pdf(analysis: dict, resume_filename: str = "Resume") -> bytes:
    """
    Generate a polished PDF report from an analysis dict.
    Returns raw PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    story = []

    # ── Custom Styles
    title_style = ParagraphStyle("Title", fontSize=24, textColor=PRIMARY, spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("Subtitle", fontSize=11, textColor=GRAY, spaceAfter=20, alignment=TA_CENTER)
    h2_style = ParagraphStyle("H2", fontSize=14, textColor=DARK, spaceBefore=16, spaceAfter=6, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body", fontSize=10, textColor=colors.black, spaceAfter=4, leading=14)
    small_style = ParagraphStyle("Small", fontSize=9, textColor=GRAY, spaceAfter=2)

    # ── Header
    story.append(Paragraph("ResumAI Analysis Report", title_style))
    story.append(Paragraph(
        f"Resume: {resume_filename} &nbsp;|&nbsp; Generated: {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    story.append(Spacer(1, 0.4 * cm))

    # ── Score Summary Table
    ats = analysis.get("ats_score") or 0
    match = analysis.get("match_percentage") or 0
    ats_color = SUCCESS if ats >= 70 else (WARNING if ats >= 50 else DANGER)
    match_color = SUCCESS if match >= 70 else (WARNING if match >= 50 else DANGER)

    score_data = [
        ["Metric", "Score", "Rating"],
        ["ATS Score", f"{ats:.1f} / 100", _rating(ats)],
        ["JD Match %", f"{match:.1f}%", _rating(match)],
        ["Grammar Issues", str(len(analysis.get("grammar_issues", []))), ""],
        ["Missing Keywords", str(len(analysis.get("missing_keywords", []))), ""],
    ]
    score_table = Table(score_data, colWidths=[8 * cm, 4 * cm, 4.5 * cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(Paragraph("📊 Score Summary", h2_style))
    story.append(score_table)
    story.append(Spacer(1, 0.4 * cm))

    # ── Matched Keywords
    matched = analysis.get("matched_keywords", [])
    if matched:
        story.append(Paragraph("✅ Matched Keywords", h2_style))
        story.append(Paragraph(", ".join(matched[:25]), body_style))
        story.append(Spacer(1, 0.2 * cm))

    # ── Missing Keywords
    missing = analysis.get("missing_keywords", [])
    if missing:
        story.append(Paragraph("⚠️ Missing Keywords", h2_style))
        story.append(Paragraph(", ".join(missing[:25]), body_style))
        story.append(Spacer(1, 0.2 * cm))

    # ── ATS Breakdown
    breakdown = analysis.get("ats_breakdown", {})
    if breakdown:
        story.append(Paragraph("🔍 ATS Score Breakdown", h2_style))
        for category, data in breakdown.items():
            if isinstance(data, dict) and "score" in data:
                cat_score = data["score"]
                story.append(Paragraph(
                    f"<b>{category.title()}</b>: {cat_score} pts", body_style
                ))
                issues = data.get("issues", data.get("notes", data.get("missing", [])))
                for issue in (issues or [])[:3]:
                    story.append(Paragraph(f"  • {issue}", small_style))
        story.append(Spacer(1, 0.2 * cm))

    # ── AI Suggestions
    ai_suggestions = analysis.get("ai_suggestions", {})
    if ai_suggestions and not ai_suggestions.get("error"):
        story.append(Paragraph("🤖 AI Improvement Suggestions", h2_style))
        for section, suggestions in ai_suggestions.items():
            if section.startswith("_") or not isinstance(suggestions, list):
                continue
            story.append(Paragraph(f"<b>{section.title()}</b>", body_style))
            for s in suggestions[:4]:
                story.append(Paragraph(f"  • {s}", small_style))
        story.append(Spacer(1, 0.2 * cm))

    # ── Grammar Issues
    grammar = analysis.get("grammar_issues", [])
    if grammar:
        story.append(Paragraph("📝 Grammar & Style Issues", h2_style))
        for issue in grammar[:10]:
            msg = issue.get("message", "")
            reps = issue.get("replacements", [])
            rep_str = f" → Suggestion: '{reps[0]}'" if reps else ""
            story.append(Paragraph(f"  • {msg}{rep_str}", small_style))

    # ── Footer
    story.append(Spacer(1, 0.6 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY))
    story.append(Paragraph(
        "Generated by ResumAI — AI-Powered Resume Analyzer",
        ParagraphStyle("Footer", fontSize=8, textColor=GRAY, alignment=TA_CENTER, spaceBefore=6)
    ))

    doc.build(story)
    return buffer.getvalue()


def _rating(score: float) -> str:
    if score >= 80:
        return "Excellent ✅"
    elif score >= 60:
        return "Good 👍"
    elif score >= 40:
        return "Fair ⚠️"
    else:
        return "Needs Work ❌"
