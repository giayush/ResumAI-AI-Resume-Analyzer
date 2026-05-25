"""
nlp_service.py
──────────────
Uses spaCy to extract structured fields from raw resume text:
  - Name, email, phone
  - Skills (technical + soft)
  - Education entries
  - Work experience entries
  - Projects
"""

import re
import spacy

# Load lazy (downloaded via: python -m spacy download en_core_web_sm)
_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


# ── Known skill libraries ────────────────────────────────────────────────────

TECH_SKILLS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "react", "vue", "angular", "next.js", "node.js", "express", "django",
    "flask", "fastapi", "spring", "rails", "laravel",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
    "git", "linux", "bash", "rest api", "graphql", "grpc",
    "machine learning", "deep learning", "nlp", "computer vision",
    "html", "css", "tailwind", "sass", "webpack", "vite",
    "swift", "kotlin", "flutter", "react native",
}

SOFT_SKILLS = {
    "communication", "teamwork", "leadership", "problem solving",
    "critical thinking", "time management", "adaptability", "creativity",
    "collaboration", "attention to detail", "project management",
    "analytical", "organized", "self-motivated", "multitasking",
}

SECTION_HEADERS = {
    "experience": ["experience", "work experience", "employment", "professional experience"],
    "education": ["education", "academic background", "qualifications"],
    "skills": ["skills", "technical skills", "core competencies", "technologies"],
    "projects": ["projects", "personal projects", "key projects"],
    "summary": ["summary", "objective", "profile", "about me"],
    "certifications": ["certifications", "certificates", "courses"],
}


def extract_structured_data(text: str) -> dict:
    """
    Parse resume text into structured sections.

    Returns:
        dict with keys: name, email, phone, skills (tech+soft),
        education, experience, projects, certifications, summary
    """
    nlp = _get_nlp()
    doc = nlp(text[:100_000])  # Limit to avoid memory issues

    result = {
        "name": _extract_name(doc, text),
        "email": _extract_email(text),
        "phone": _extract_phone(text),
        "skills": _extract_skills(text),
        "education": _extract_section(text, "education"),
        "experience": _extract_section(text, "experience"),
        "projects": _extract_section(text, "projects"),
        "certifications": _extract_section(text, "certifications"),
        "summary": _extract_section(text, "summary"),
    }
    return result


def _extract_name(doc, text: str) -> str:
    """Try to find PERSON entity near the top of the document."""
    first_500 = text[:500]
    nlp = _get_nlp()
    short_doc = nlp(first_500)
    for ent in short_doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()
    # Fallback: first non-empty line
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped and len(stripped.split()) <= 5:
            return stripped
    return ""


def _extract_email(text: str) -> str:
    emails = re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return emails[0] if emails else ""


def _extract_phone(text: str) -> str:
    phones = re.findall(
        r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{3}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}", text
    )
    return phones[0] if phones else ""


def _extract_skills(text: str) -> dict:
    text_lower = text.lower()
    tech = sorted([s for s in TECH_SKILLS if s in text_lower])
    soft = sorted([s for s in SOFT_SKILLS if s in text_lower])
    return {"technical": tech, "soft": soft}


def _extract_section(text: str, section_key: str) -> list[str]:
    """
    Extract bullet lines from a detected section.
    Returns a list of non-empty lines within that section.
    """
    headers = SECTION_HEADERS.get(section_key, [])
    lines = text.split("\n")
    capturing = False
    section_lines = []

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()

        # Detect section start
        if any(h in line_lower for h in headers) and len(line_stripped) < 60:
            capturing = True
            continue

        # Detect next section header (stop capturing)
        if capturing and len(line_stripped) < 60:
            is_other_header = any(
                any(h in line_lower for h in hdrs)
                for key, hdrs in SECTION_HEADERS.items()
                if key != section_key
            )
            if is_other_header:
                break

        if capturing and line_stripped:
            section_lines.append(line_stripped)

    return section_lines[:30]  # Cap at 30 lines per section
