"""
ats_service.py
──────────────
ATS (Applicant Tracking System) rule-based scoring engine.

Checks:
  1. Section completeness (25 pts)
  2. Keyword density (25 pts)
  3. Formatting signals (20 pts)
  4. Content quality (20 pts)
  5. Contact completeness (10 pts)
"""

import re
from .nlp_service import TECH_SKILLS, SECTION_HEADERS


# ── ATS Scorer ───────────────────────────────────────────────────────────────

def calculate_ats_score(
    resume_text: str,
    parsed_data: dict,
    job_description: str = "",
) -> dict:
    """
    Run all ATS checks and return a score (0–100) with breakdown.
    """
    breakdown = {}
    score = 0

    # 1. Section completeness (25 pts)
    section_score = _check_sections(resume_text, parsed_data)
    breakdown["sections"] = section_score
    score += section_score["score"]

    # 2. Keyword density (25 pts)
    keyword_score = _check_keywords(resume_text, job_description)
    breakdown["keywords"] = keyword_score
    score += keyword_score["score"]

    # 3. Formatting signals (20 pts)
    format_score = _check_formatting(resume_text)
    breakdown["formatting"] = format_score
    score += format_score["score"]

    # 4. Content quality (20 pts)
    content_score = _check_content_quality(resume_text, parsed_data)
    breakdown["content"] = content_score
    score += content_score["score"]

    # 5. Contact completeness (10 pts)
    contact_score = _check_contact(parsed_data)
    breakdown["contact"] = contact_score
    score += contact_score["score"]

    # Extract required skills from JD
    required_skills = _extract_jd_skills(job_description)
    resume_skills_flat = _flatten_skills(parsed_data.get("skills", {}))
    skill_gaps = [s for s in required_skills if s not in resume_skills_flat]

    return {
        "ats_score": min(round(score, 1), 100),
        "breakdown": breakdown,
        "required_skills": required_skills,
        "skill_gaps": skill_gaps[:20],
    }


# ── Individual Checks ─────────────────────────────────────────────────────────

def _check_sections(text: str, parsed_data: dict) -> dict:
    """Check presence of key resume sections (25 pts)."""
    text_lower = text.lower()
    required = {
        "summary": ["summary", "objective", "profile"],
        "experience": ["experience", "employment", "work"],
        "education": ["education", "academic"],
        "skills": ["skills", "competencies", "technologies"],
    }
    found = []
    missing = []
    for section, keywords in required.items():
        if any(kw in text_lower for kw in keywords):
            found.append(section)
        else:
            missing.append(section)

    pts_per = 25 / len(required)
    score = len(found) * pts_per
    return {"score": round(score, 1), "found": found, "missing": missing}


def _check_keywords(text: str, job_description: str) -> dict:
    """Check JD keyword coverage (25 pts)."""
    if not job_description:
        return {"score": 12.5, "note": "No job description provided"}

    jd_words = set(re.findall(r"\b[a-zA-Z+#]{3,}\b", job_description.lower()))
    resume_words = set(re.findall(r"\b[a-zA-Z+#]{3,}\b", text.lower()))

    # Focus on meaningful words (>3 chars, not stop words)
    _stops = {"the", "and", "for", "are", "was", "with", "have", "that"}
    jd_keywords = jd_words - _stops
    if not jd_keywords:
        return {"score": 12.5, "note": "No meaningful JD keywords"}

    overlap = jd_keywords & resume_words
    coverage = len(overlap) / len(jd_keywords)
    score = min(coverage * 25, 25)
    return {
        "score": round(score, 1),
        "coverage_pct": round(coverage * 100, 1),
        "jd_keyword_count": len(jd_keywords),
        "matched_count": len(overlap),
    }


def _check_formatting(text: str) -> dict:
    """
    Check ATS-friendly formatting signals (20 pts).
    ATS systems struggle with tables, columns, and unusual characters.
    """
    issues = []
    score = 20

    # Check for bullet points (good)
    bullet_count = len(re.findall(r"^[\•\-\*\▪\–]\s", text, re.MULTILINE))
    if bullet_count < 3:
        issues.append("Too few bullet points (improves readability)")
        score -= 5

    # Check for overly long lines without breaks (may indicate table/column layout)
    lines = text.split("\n")
    avg_len = sum(len(l) for l in lines if l.strip()) / max(len(lines), 1)
    if avg_len > 120:
        issues.append("Possible multi-column layout detected (ATS-unfriendly)")
        score -= 5

    # Check for reasonable length
    word_count = len(text.split())
    if word_count < 150:
        issues.append("Resume is very short (< 150 words)")
        score -= 5
    elif word_count > 1200:
        issues.append("Resume is very long (> 1200 words) — consider trimming")
        score -= 3

    # Check for dates (work history depth)
    year_pattern = r"\b(19|20)\d{2}\b"
    years_found = re.findall(year_pattern, text)
    if len(years_found) < 2:
        issues.append("Missing dates — add dates to experience/education")
        score -= 5

    return {"score": max(round(score, 1), 0), "issues": issues}


def _check_content_quality(text: str, parsed_data: dict) -> dict:
    """Check content richness and action verb usage (20 pts)."""
    action_verbs = {
        "achieved", "built", "created", "designed", "developed", "delivered",
        "improved", "implemented", "increased", "launched", "led", "managed",
        "optimized", "reduced", "resolved", "spearheaded", "streamlined",
        "collaborated", "established", "generated", "mentored",
    }
    text_lower = text.lower()
    found_verbs = [v for v in action_verbs if v in text_lower]

    quantified = len(re.findall(r"\d+%|\$\d+|\d+[xX]|\d+ (users|customers|team|projects)", text))
    score = 0
    notes = []

    if len(found_verbs) >= 5:
        score += 10
    elif len(found_verbs) >= 2:
        score += 5
        notes.append("Add more action verbs (achieved, built, led…)")
    else:
        notes.append("Missing action verbs in experience bullets")

    if quantified >= 3:
        score += 10
    elif quantified >= 1:
        score += 5
        notes.append("Quantify more achievements (numbers, percentages)")
    else:
        notes.append("No quantified achievements found — add metrics!")

    return {"score": round(score, 1), "action_verbs_found": found_verbs[:10], "notes": notes}


def _check_contact(parsed_data: dict) -> dict:
    """Check contact info completeness (10 pts)."""
    score = 0
    found = []
    missing = []

    if parsed_data.get("name"):
        score += 3
        found.append("name")
    else:
        missing.append("name")

    if parsed_data.get("email"):
        score += 4
        found.append("email")
    else:
        missing.append("email")

    if parsed_data.get("phone"):
        score += 3
        found.append("phone")
    else:
        missing.append("phone")

    return {"score": score, "found": found, "missing": missing}


def _extract_jd_skills(job_description: str) -> list[str]:
    if not job_description:
        return []
    jd_lower = job_description.lower()
    return sorted([s for s in TECH_SKILLS if s in jd_lower])


def _flatten_skills(skills: dict) -> list[str]:
    flat = []
    if isinstance(skills, dict):
        flat.extend(skills.get("technical", []))
        flat.extend(skills.get("soft", []))
    elif isinstance(skills, list):
        flat = skills
    return [s.lower() for s in flat]
