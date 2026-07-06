"""Deterministic multilingual question understanding for Jyotish questions.

This module deliberately performs no astrology and accesses no personal data.
It converts a free-form English/Hindi question into a small, validated intent
object that the existing Jyotish rule engine can use safely.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


SERVICE_VERSION = "question-understanding-v2"


@dataclass(frozen=True)
class IntentDefinition:
    category: str
    subtype: str
    action_key: str
    focus_en: str
    focus_hi: str
    phrases: tuple[str, ...]
    keywords: tuple[str, ...]


INTENTS = (
    IntentDefinition("career", "general", "career_general", "career direction, suitable work and professional growth", "करियर की दिशा, उपयुक्त कार्य और पेशेवर विकास", ("career path", "best career", "suitable career", "career direction", "करियर की दिशा", "कौन सा करियर", "उपयुक्त काम"), ("career", "profession", "work", "करियर", "पेशा", "काम")),
    IntentDefinition("career", "job_offer", "career_job_offer", "whether to accept the job offer", "नौकरी का प्रस्ताव स्वीकार करना चाहिए या नहीं", ("job offer", "offer letter", "accept offer", "नौकरी का प्रस्ताव", "ऑफर स्वीकार"), ("job", "offer", "salary", "joining", "नौकरी", "ऑफर", "वेतन", "जॉइन")),
    IntentDefinition("career", "job_change", "career_job_change", "whether changing the current job is suitable", "मौजूदा नौकरी बदलना उचित है या नहीं", ("change job", "switch job", "leave my job", "नौकरी बदल", "जॉब बदल", "नौकरी छोड़"), ("switch", "resign", "career", "change", "बदल", "इस्तीफा", "करियर")),
    IntentDefinition("career", "promotion", "career_promotion", "the possibility and timing of a promotion", "पदोन्नति की संभावना और समय", ("get promoted", "promotion", "salary hike", "पदोन्नति", "प्रमोशन", "वेतन वृद्धि"), ("promotion", "promoted", "hike", "पदोन्नति", "प्रमोशन")),
    IntentDefinition("career", "business_start", "career_business_start", "whether to begin or expand a business", "व्यवसाय शुरू या बढ़ाना उचित है या नहीं", ("start business", "new business", "business partner", "व्यवसाय शुरू", "बिजनेस शुरू", "कारोबार"), ("business", "startup", "partner", "व्यवसाय", "बिजनेस", "कारोबार")),
    IntentDefinition("marriage", "general", "marriage_general", "relationships, marriage and long-term partnership", "रिश्ते, विवाह और दीर्घकालीन साझेदारी", ("married life", "relationship future", "marriage prospects", "वैवाहिक जीवन", "रिश्ते का भविष्य", "विवाह योग"), ("marriage", "relationship", "partner", "विवाह", "शादी", "रिश्ता")),
    IntentDefinition("marriage", "marriage_proposal", "marriage_proposal", "whether to proceed with this relationship or proposal", "इस रिश्ते या प्रस्ताव में आगे बढ़ना चाहिए या नहीं", ("marriage proposal", "accept proposal", "marry this person", "विवाह प्रस्ताव", "शादी का प्रस्ताव", "इससे शादी"), ("proposal", "partner", "relationship", "प्रस्ताव", "रिश्ता")),
    IntentDefinition("marriage", "marriage_timing", "marriage_timing", "the likely timing of marriage", "विवाह का संभावित समय", ("when will i marry", "marriage timing", "शादी कब", "विवाह कब"), ("when", "marry", "timing", "कब", "शादी", "विवाह")),
    IntentDefinition("finance", "general", "finance_general", "income, savings and financial growth", "आय, बचत और आर्थिक विकास", ("improve finances", "financial growth", "increase income", "धन कैसे बढ़े", "आय बढ़ाना", "आर्थिक स्थिति"), ("finance", "finances", "income", "savings", "wealth", "आय", "बचत", "धन")),
    IntentDefinition("finance", "investment", "finance_investment", "whether this financial commitment is suitable", "यह निवेश या आर्थिक निर्णय उचित है या नहीं", ("should i invest", "investment", "buy shares", "निवेश करना", "पैसा लगाना", "शेयर खरीद"), ("invest", "investment", "return", "loan", "निवेश", "पैसा", "ऋण", "लाभ")),
    IntentDefinition("property", "property_purchase", "property_purchase", "whether to buy or commit to this property", "यह संपत्ति खरीदना या तय करना उचित है या नहीं", ("buy property", "buy house", "purchase land", "घर खरीद", "जमीन खरीद", "संपत्ति खरीद"), ("property", "house", "land", "flat", "संपत्ति", "घर", "जमीन", "फ्लैट")),
    IntentDefinition("education", "general", "education_general", "education, learning and skill development", "शिक्षा, अध्ययन और कौशल विकास", ("education path", "what should i study", "learning direction", "क्या पढ़ना चाहिए", "शिक्षा की दिशा", "कौशल विकास"), ("education", "study", "learning", "शिक्षा", "पढ़ाई", "अध्ययन")),
    IntentDefinition("education", "exam", "education_exam", "the examination outcome and preparation decision", "परीक्षा के परिणाम और तैयारी का निर्णय", ("pass exam", "exam result", "clear exam", "परीक्षा पास", "एग्जाम पास", "परीक्षा परिणाम"), ("exam", "admission", "परीक्षा", "प्रवेश")),
    IntentDefinition("travel", "relocation", "travel_relocation", "whether travel or relocation is suitable", "यात्रा या स्थान परिवर्तन उचित है या नहीं", ("move abroad", "relocate", "move to", "विदेश जाना", "स्थान बदल", "शहर बदल"), ("travel", "relocate", "abroad", "visa", "यात्रा", "विदेश", "स्थान")),
    IntentDefinition("health", "general", "health_general", "health patterns, routine and wellbeing", "स्वास्थ्य की प्रवृत्ति, दिनचर्या और सेहत", ("health pattern", "improve my health", "wellbeing", "स्वास्थ्य कैसा", "सेहत सुधार", "दिनचर्या"), ("health", "wellbeing", "fitness", "स्वास्थ्य", "सेहत")),
    IntentDefinition("health", "recovery", "health_recovery", "health recovery and the next care decision", "स्वास्थ्य सुधार और अगली देखभाल का निर्णय", ("will i recover", "health recovery", "treatment outcome", "स्वास्थ्य सुधर", "ठीक कब", "इलाज का असर"), ("recover", "recovery", "treatment", "illness", "सुधर", "इलाज", "बीमारी")),
    IntentDefinition("legal", "dispute", "legal_dispute", "the direction of the dispute or legal matter", "विवाद या कानूनी विषय की दिशा", ("court case", "legal case", "win dispute", "कोर्ट केस", "कानूनी मामला", "विवाद"), ("court", "legal", "case", "dispute", "कोर्ट", "कानूनी", "विवाद")),
    IntentDefinition("lost_object", "recovery", "lost_object_recovery", "the recovery of the missing item", "खोई हुई वस्तु मिलने की संभावना", ("find my", "lost item", "missing item", "खोई हुई", "गुम वस्तु", "सामान मिलेगा"), ("lost", "missing", "find", "खो", "गुम", "मिलेगा")),
    IntentDefinition("family", "family_decision", "family_decision", "the family decision and its practical impact", "पारिवारिक निर्णय और उसका व्यावहारिक प्रभाव", ("family problem", "home conflict", "family decision", "परिवार की समस्या", "घर का विवाद", "पारिवारिक निर्णय"), ("family", "home", "parents", "परिवार", "घर", "माता", "पिता")),
    IntentDefinition("family", "children", "family_children", "children, conception or the child's development", "संतान, गर्भधारण या बच्चे के विकास का विषय", ("have a child", "child birth", "planning a baby", "my child", "संतान कब", "गर्भधारण", "बच्चे की पढ़ाई"), ("child", "children", "baby", "conception", "संतान", "बच्चा", "गर्भ")),
    IntentDefinition("family", "parents", "family_parents", "parents and your responsibilities toward them", "माता-पिता और उनके प्रति आपकी जिम्मेदारियां", ("my parents", "mother health", "father health", "माता पिता", "मां की सेहत", "पिता की सेहत"), ("mother", "father", "parents", "माता", "पिता", "मां")),
    IntentDefinition("general", "spiritual_growth", "general_spiritual", "spiritual direction and inner growth", "आध्यात्मिक दिशा और आंतरिक विकास", ("spiritual path", "spiritual growth", "meditation practice", "आध्यात्मिक मार्ग", "साधना", "ध्यान करना"), ("spiritual", "meditation", "purpose", "आध्यात्मिक", "साधना", "ध्यान")),
)


CATEGORY_FALLBACK = {
    "general": ("the direction of this decision", "इस निर्णय की दिशा", "general_decision"),
    "career": ("the work or career decision", "काम या करियर का निर्णय", "career_general"),
    "marriage": ("the relationship or marriage decision", "रिश्ते या विवाह का निर्णय", "marriage_general"),
    "finance": ("the money decision", "धन का निर्णय", "finance_general"),
    "health": ("health and recovery", "स्वास्थ्य और सुधार", "health_general"),
    "legal": ("the dispute or legal matter", "विवाद या कानूनी विषय", "legal_general"),
    "travel": ("travel or relocation", "यात्रा या स्थान परिवर्तन", "travel_general"),
    "lost_object": ("the missing item", "खोई हुई वस्तु", "lost_object_general"),
    "property": ("the property or home decision", "संपत्ति या घर का निर्णय", "property_general"),
    "education": ("education or examination", "शिक्षा या परीक्षा", "education_general"),
    "family": ("the family or home decision", "परिवार या घर का निर्णय", "family_general"),
}


YES_NO_MARKERS = ("should i", "is this", "will it", "can i", "क्या", "चाहिए", "होगा", "होगी")
TIMING_MARKERS = ("when", "how long", "right time", "कब", "कितना समय", "सही समय")
COMPARISON_MARKERS = ("or", "versus", "better than", "या", "बेहतर")


# Python selects the minimum relevant chart set. Personal chart data remains in
# the authenticated Node process; only these allow-listed routing instructions
# cross the service boundary.
KUNDLI_ROUTING = {
    "career_job_offer": (("d1", "d10"), (1, 6, 10, 11), ("Sun", "Saturn", "Mercury"), "career", "career"),
    "career_job_change": (("d1", "d10"), (1, 6, 10, 11), ("Sun", "Saturn", "Mercury"), "career", "career"),
    "career_promotion": (("d1", "d10"), (1, 10, 11), ("Sun", "Saturn", "Jupiter"), "career", "career"),
    "career_business_start": (("d1", "d2", "d10"), (2, 7, 10, 11), ("Mercury", "Mars", "Saturn"), "career", "finance"),
    "marriage_proposal": (("d1", "d9"), (1, 5, 7, 11), ("Venus", "Jupiter", "Moon"), "relationships", "relationships"),
    "marriage_timing": (("d1", "d9"), (2, 7, 11), ("Venus", "Jupiter"), "relationships", "relationships"),
    "finance_investment": (("d1", "d2"), (2, 5, 8, 11), ("Jupiter", "Mercury", "Venus"), "finance", "finance"),
    "property_purchase": (("d1", "d4", "d16"), (4, 8, 11), ("Mars", "Venus", "Moon"), "finance", "finance"),
    "education_exam": (("d1", "d24"), (4, 5, 9), ("Mercury", "Jupiter"), "education_spiritual", "education"),
    "travel_relocation": (("d1", "d4", "d9"), (3, 4, 9, 12), ("Moon", "Rahu", "Saturn"), "career", "travel"),
    "health_recovery": (("d1", "d27", "d30"), (1, 6, 8, 12), ("Sun", "Moon", "Mars"), "health", "health"),
    "legal_dispute": (("d1", "d30"), (6, 7, 8), ("Mars", "Saturn", "Jupiter"), "finance", "legal"),
    "lost_object_recovery": (("d1",), (2, 4, 11, 12), ("Moon", "Mercury"), "finance", "general"),
    "family_decision": (("d1", "d12"), (2, 4, 9), ("Moon", "Sun", "Jupiter"), "relationships", "family"),
    "family_children": (("d1", "d7"), (2, 5, 9), ("Jupiter", "Moon"), "relationships", "family"),
    "family_parents": (("d1", "d12"), (4, 9, 10), ("Sun", "Moon"), "relationships", "family"),
    "general_spiritual": (("d1", "d20"), (5, 9, 12), ("Jupiter", "Ketu", "Sun"), "education_spiritual", "spiritual"),
}

CATEGORY_ROUTING = {
    "career": (("d1", "d10"), (1, 6, 10, 11), ("Sun", "Saturn", "Mercury"), "career", "career"),
    "marriage": (("d1", "d9"), (1, 5, 7, 11), ("Venus", "Jupiter"), "relationships", "relationships"),
    "finance": (("d1", "d2"), (2, 5, 8, 11), ("Jupiter", "Mercury", "Venus"), "finance", "finance"),
    "health": (("d1", "d27", "d30"), (1, 6, 8, 12), ("Sun", "Moon", "Mars"), "health", "health"),
    "legal": (("d1", "d30"), (6, 7, 8), ("Mars", "Saturn", "Jupiter"), "finance", "legal"),
    "travel": (("d1", "d4", "d9"), (3, 4, 9, 12), ("Moon", "Rahu"), "career", "travel"),
    "property": (("d1", "d4", "d16"), (4, 8, 11), ("Mars", "Venus", "Moon"), "finance", "finance"),
    "education": (("d1", "d24"), (4, 5, 9), ("Mercury", "Jupiter"), "education_spiritual", "education"),
    "family": (("d1", "d12"), (2, 4, 9), ("Moon", "Sun", "Jupiter"), "relationships", "family"),
    "lost_object": (("d1",), (2, 4, 11, 12), ("Moon", "Mercury"), "finance", "general"),
    "general": (("d1", "d9"), (1, 5, 9), ("Sun", "Moon", "Jupiter"), "education_spiritual", "general"),
}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "").lower()
    text = re.sub(r"[^\w\u0900-\u097f]+", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def _score(intent: IntentDefinition, normalized: str, tokens: set[str]) -> float:
    score = 0.0
    for phrase in intent.phrases:
        normalized_phrase = _normalize(phrase)
        if normalized_phrase and normalized_phrase in normalized:
            score += 4.0 + min(2.0, len(normalized_phrase.split()) * 0.4)
    for keyword in intent.keywords:
        normalized_keyword = _normalize(keyword)
        if normalized_keyword in tokens or (" " in normalized_keyword and normalized_keyword in normalized):
            score += 1.25
    return score


def _has_marker(normalized: str, markers: tuple[str, ...]) -> bool:
    tokens = set(normalized.split())
    return any((marker in normalized) if " " in marker else (marker in tokens) for marker in markers)


def _decision_mode(normalized: str) -> str:
    if _has_marker(normalized, TIMING_MARKERS):
        return "timing"
    if _has_marker(normalized, COMPARISON_MARKERS):
        return "comparison"
    if _has_marker(normalized, YES_NO_MARKERS):
        return "decision"
    return "guidance"


def analyze_question(question: str, selected_category: str = "general", analysis_mode: str = "prashna") -> dict:
    normalized = _normalize(question)
    selected_category = selected_category if selected_category in CATEGORY_FALLBACK else "general"
    tokens = set(normalized.split())
    ranked = sorted(((intent, _score(intent, normalized, tokens)) for intent in INTENTS), key=lambda item: item[1], reverse=True)
    best, best_score = ranked[0]
    second_score = ranked[1][1]

    if best_score <= 0:
        focus_en, focus_hi, action_key = CATEGORY_FALLBACK[selected_category]
        category = selected_category
        subtype = "general"
        confidence = 0.52 if selected_category != "general" else 0.30
    else:
        # Respect an explicit non-general selection unless the text strongly contradicts it.
        if selected_category != "general" and best.category != selected_category and best_score < 8:
            focus_en, focus_hi, action_key = CATEGORY_FALLBACK[selected_category]
            category = selected_category
            subtype = "general"
            confidence = 0.58
        else:
            focus_en, focus_hi, action_key = best.focus_en, best.focus_hi, best.action_key
            category, subtype = best.category, best.subtype
            separation = max(0.0, best_score - second_score)
            confidence = min(0.97, 0.58 + best_score * 0.035 + separation * 0.025)

    language = "hi" if re.search(r"[\u0900-\u097f]", question or "") else "en"
    ambiguity = len(tokens) < 4 or confidence < 0.56
    mode = _decision_mode(normalized)
    routing = KUNDLI_ROUTING.get(action_key) or CATEGORY_ROUTING[category]
    chart_slugs, focus_houses, focus_planets, timing_key, safety_note_key = routing
    result = {
        "version": SERVICE_VERSION,
        "detected_category": category,
        "selected_category": selected_category,
        "subtype": subtype,
        "action_key": action_key,
        "decision_mode": mode,
        "language": language,
        "confidence": round(confidence, 2),
        "is_ambiguous": ambiguity,
        "understood_as_en": focus_en,
        "understood_as_hi": focus_hi,
        "needs_clarification_en": "Add the exact choice, person or outcome you want to decide." if ambiguity else "",
        "needs_clarification_hi": "जिस विकल्प, व्यक्ति या परिणाम पर निर्णय चाहिए, उसे स्पष्ट रूप से लिखें।" if ambiguity else "",
        "analysis_mode": "kundli" if analysis_mode == "kundli" else "prashna",
        "chart_slugs": list(chart_slugs),
        "focus_houses": list(focus_houses),
        "focus_planets": list(focus_planets),
        "timing_key": timing_key,
        "safety_note_key": safety_note_key,
    }
    return result


__all__ = ["SERVICE_VERSION", "analyze_question"]
