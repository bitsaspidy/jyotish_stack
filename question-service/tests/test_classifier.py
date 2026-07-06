import unittest

from classifier import SERVICE_VERSION, analyze_question


class QuestionClassifierTests(unittest.TestCase):
    def test_understands_english_job_offer(self):
        result = analyze_question("Is this the right time to accept the job offer?", "career")
        self.assertEqual(result["version"], SERVICE_VERSION)
        self.assertEqual(result["detected_category"], "career")
        self.assertEqual(result["subtype"], "job_offer")
        self.assertEqual(result["action_key"], "career_job_offer")
        self.assertEqual(result["decision_mode"], "timing")
        self.assertGreaterEqual(result["confidence"], 0.7)

    def test_understands_hindi_job_change(self):
        result = analyze_question("क्या मुझे अपनी नौकरी बदलनी चाहिए?", "career")
        self.assertEqual(result["language"], "hi")
        self.assertEqual(result["subtype"], "job_change")
        self.assertEqual(result["decision_mode"], "decision")

    def test_understands_hindi_marriage_timing(self):
        result = analyze_question("मेरी शादी कब होने की संभावना है?", "general")
        self.assertEqual(result["detected_category"], "marriage")
        self.assertEqual(result["subtype"], "marriage_timing")
        self.assertEqual(result["decision_mode"], "timing")

    def test_respects_explicit_category_for_weak_cross_category_text(self):
        result = analyze_question("Will this situation improve soon?", "finance")
        self.assertEqual(result["detected_category"], "finance")
        self.assertEqual(result["subtype"], "general")

    def test_marks_vague_question_for_clarification(self):
        result = analyze_question("Will it happen?", "general")
        self.assertTrue(result["is_ambiguous"])
        self.assertTrue(result["needs_clarification_en"])


if __name__ == "__main__":
    unittest.main()
