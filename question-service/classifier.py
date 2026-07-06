"""Deterministic multilingual question understanding for Prashna.

This module deliberately performs no astrology and accesses no personal data.
It converts a free-form English/Hindi question into a small, validated intent
object that the existing Jyotish rule engine can use safely.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import asdict, dataclass


SERVICE_VERSION = "question-understanding-v1"


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
    IntentDefinition("career", "job_offer", "career_job_offer", "whether to accept the job offer", "नौकरी का प्रस्ताव स्वीकार करना चाहिए या नहीं", ("job offer", "offer letter", "accept offer", "नौकरी का प्रस्ताव", "ऑफर स्वीकार"), ("job", "offer", "salary", "joining", "नौकरी", "ऑफर", "वेतन", "जॉइन")),
    IntentDefinition("career", "job_change", "career_job_change", "whether changing the current job is suitable", "मौजूदा नौकरी बदलना उचित है या नहीं", ("change job", "switch job", "leave my job", "नौकरी बदल", "जॉब बदल", "नौकरी छोड़"), ("switch", "resign", "career", "change", "बदल", "इस्तीफा", "करियर")),
    IntentDefinition("career", "promotion", "career_promotion", "the possibility and timing of a promotion", "पदोन्नति की संभावना और समय", ("get promoted", "promotion", "salary hike", "पदोन्नति", "प्रमोशन", "वेतन वृद्धि"), ("promotion", "promoted", "hike", "पदोन्नति", "प्रमोशन")),
    IntentDefinition("career", "business_start", "career_business_start", "whether to begin or expand a business", "व्यवसाय शुरू या बढ़ाना उचित है या नहीं", ("start business", "new business", "business partner", "व्यवसाय शुरू", "बिजनेस शुरू", "कारोबार"), ("business", "startup", "partner", "व्यवसाय", "बिजनेस", "कारोबार")),
    IntentDefinition("marriage", "marriage_proposal", "marriage_proposal", "whether to proceed with this relationship or proposal", "इस रिश्ते या प्रस्ताव में आगे बढ़ना चाहिए या नहीं", ("marriage proposal", "accept proposal", "marry this person", "विवाह प्रस्ताव", "शादी का प्रस्ताव", "इससे शादी"), ("marriage", "proposal", "partner", "relationship", "विवाह", "शादी", "रिश्ता")),
    IntentDefinition("marriage", "marriage_timing", "marriage_timing", "the likely timing of marriage", "विवाह का संभावित समय", ("when will i marry", "marriage timing", "शादी कब", "विवाह कब"), ("when", "marry", "timing", "कब", "शादी", "विवाह")),
    IntentDefinition("finance", "investment", "finance_investment", "whether this financial commitment is suitable", "यह निवेश या आर्थिक निर्णय उचित है या नहीं", ("should i invest", "investment", "buy shares", "निवेश करना", "पैसा लगाना", "शेयर खरीद"), ("invest", "money", "return", "loan", "निवेश", "पैसा", "ऋण", "लाभ")),
    IntentDefinition("property", "property_purchase", "property_purchase", "whether to buy or commit to this property", "यह संपत्ति खरीदना या तय करना उचित है या नहीं", ("buy property", "buy house", "purchase land", "घर खरीद", "जमीन खरीद", "संपत्ति खरीद"), ("property", "house", "land", "flat", "संपत्ति", "घर", "जमीन", "फ्लैट")),
    IntentDefinition("education", "exam", "education_exam", "the examination outcome and preparation decision", "परीक्षा के परिणाम और तैयारी का निर्णय", ("pass exam", "exam result", "clear exam", "परीक्षा पास", "एग्जाम पास", "परीक्षा परिणाम"), ("exam", "study", "admission", "परीक्षा", "पढ़ाई", "प्रवेश")),
    IntentDefinition("travel", "relocation", "travel_relocation", "whether travel or relocation is suitable", "यात्रा या स्थान परिवर्तन उचित है या नहीं", ("move abroad", "relocate", "move to", "विदेश जाना", "स्थान बदल", "शहर बदल"), ("travel", "relocate", "abroad", "visa", "यात्रा", "विदेश", "स्थान")),
    IntentDefinition("health", "recovery", "health_recovery", "health recovery and the next care decision", "स्वास्थ्य सुधार और अगली देखभाल का निर्णय", ("will i recover", "health improve", "recovery", "स्वास्थ्य सुधर", "ठीक कब", "सेहत"), ("health", "recover", "treatment", "स्वास्थ्य", "सेहत", "इलाज")),
    IntentDefinition("legal", "dispute", "legal_dispute", "the direction of the dispute or legal matter", "विवाद या कानूनी विषय की दिशा", ("court case", "legal case", "win dispute", "कोर्ट केस", "कानूनी मामला", "विवाद"), ("court", "legal", "case", "dispute", "कोर्ट", "कानूनी", "विवाद")),
    IntentDefinition("lost_object", "recovery", "lost_object_recovery", "the recovery of the missing item", "खोई हुई वस्तु मिलने की संभावना", ("find my", "lost item", "missing item", "खोई हुई", "गुम वस्तु", "सामान मिलेगा"), ("lost", "missing", "find", "खो", "गुम", "मिलेगा")),
    IntentDefinition("family", "family_decision", "family_decision", "the family decision and its practical impact", "पारिवारिक निर्णय और उसका व्यावहारिक प्रभाव", ("family problem", "home conflict", "family decision", "परिवार की समस्या", "घर का विवाद", "पारिवारिक निर्णय"), ("family", "home", "parents", "परिवार", "घर", "माता", "पिता")),
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


def analyze_question(question: str, selected_category: str = "general") -> dict:
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
    }
    return result


__all__ = ["SERVICE_VERSION", "analyze_question"]
