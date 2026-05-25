"""
tfidf_service.py — Keyword matching between resume and job description.

Performance fix (BUG-12):
  - Pre-compute feature_name → index dict for O(1) lookup (was O(n²)).

Algorithm improvement:
  - ngram_range extended to (1, 3) to capture multi-word tech terms.
  - Uses sklearn's english stop_words instead of small custom set.
"""

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# ── Text Preprocessing ───────────────────────────────────────────────────────

def _preprocess(text: str) -> str:
    """Lowercase, keep tech-relevant chars (+ # .), remove noise."""
    text = text.lower()
    # Keep alphanumeric, +, #, . (for C++, C#, Next.js etc.)
    text = re.sub(r"[^a-z0-9\s+#.]", " ", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ── Core TF-IDF Engine ───────────────────────────────────────────────────────

def compute_similarity(resume_text: str, job_description: str) -> dict:
    """
    Compute TF-IDF cosine similarity between resume and JD.

    Returns:
        {
          match_percentage: float (0–100),
          matched_keywords: list[str],
          missing_keywords: list[str],
          tfidf_scores: dict[str, float],   # keyword → JD TF-IDF weight
        }
    """
    if not resume_text or not resume_text.strip():
        return _empty_result()
    if not job_description or not job_description.strip():
        return _empty_result()

    clean_resume = _preprocess(resume_text)
    clean_jd = _preprocess(job_description)

    # Fit TF-IDF on both documents
    # ngram_range (1,3) captures "machine learning", "react native", "aws lambda"
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=500,
        min_df=1,
        sublinear_tf=True,
        stop_words="english",  # use sklearn's built-in 318-word English stop list
    )
    try:
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
    except ValueError:
        return _empty_result()

    resume_vec = tfidf_matrix[0]
    jd_vec = tfidf_matrix[1]

    # Cosine similarity
    similarity = cosine_similarity(resume_vec, jd_vec)[0][0]
    match_percentage = round(float(similarity) * 100, 1)

    # BUG-12 FIX: Pre-compute index dict for O(1) lookups instead of O(n) per keyword
    feature_names = vectorizer.get_feature_names_out()
    name_to_idx = {name: i for i, name in enumerate(feature_names)}  # O(n) once

    jd_weights = jd_vec.toarray()[0]
    resume_weights = resume_vec.toarray()[0]

    # Build importance ranking from JD weights (only keywords that appear in JD)
    keyword_importance = {
        name: round(float(jd_weights[i]), 4)
        for name, i in name_to_idx.items()
        if jd_weights[i] > 0
    }

    # Sort by importance desc, take top 60
    sorted_keywords = sorted(keyword_importance.items(), key=lambda x: -x[1])[:60]

    matched_keywords = []
    missing_keywords = []

    for keyword, weight in sorted_keywords:
        idx = name_to_idx[keyword]  # O(1) — BUG-12 fixed
        if resume_weights[idx] > 0:
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    return {
        "match_percentage": match_percentage,
        "matched_keywords": matched_keywords[:30],
        "missing_keywords": missing_keywords[:30],
        "tfidf_scores": dict(sorted_keywords[:50]),
    }


def _empty_result() -> dict:
    return {
        "match_percentage": 0.0,
        "matched_keywords": [],
        "missing_keywords": [],
        "tfidf_scores": {},
    }
