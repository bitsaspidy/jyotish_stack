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

    def test_kundli_career_question_routes_to_d1_and_d10(self):
        result = analyze_question("Will I get a promotion in my current job?", "general", "kundli")
        self.assertEqual(result["analysis_mode"], "kundli")
        self.assertEqual(result["action_key"], "career_promotion")
        self.assertEqual(result["chart_slugs"], ["d1", "d10"])
        self.assertEqual(result["timing_key"], "career")
        self.assertIn(10, result["focus_houses"])

    def test_kundli_children_question_routes_to_d7(self):
        result = analyze_question("When are we likely to have a child?", "general", "kundli")
        self.assertEqual(result["action_key"], "family_children")
        self.assertIn("d7", result["chart_slugs"])
        self.assertEqual(result["detected_category"], "family")

    def test_kundli_general_career_question_is_not_mislabeled_as_job_change(self):
        result = analyze_question("What career is best for me?", "general", "kundli")
        self.assertEqual(result["detected_category"], "career")
        self.assertEqual(result["subtype"], "general")
        self.assertEqual(result["action_key"], "career_general")
        self.assertEqual(result["chart_slugs"], ["d1", "d10"])

    def test_kundli_general_finance_question_routes_to_d2(self):
        result = analyze_question("How can my finances improve?", "general", "kundli")
        self.assertEqual(result["detected_category"], "finance")
        self.assertEqual(result["subtype"], "general")
        self.assertIn("d2", result["chart_slugs"])

    def test_kundli_home_purchase_routes_to_property_charts(self):
        result = analyze_question("Is this a good period to buy a home?", "general", "kundli")
        self.assertEqual(result["detected_category"], "property")
        self.assertEqual(result["subtype"], "property_purchase")
        self.assertEqual(result["action_key"], "property_purchase")
        self.assertEqual(result["decision_mode"], "timing")
        self.assertEqual(result["chart_slugs"], ["d1", "d4", "d16"])
        self.assertEqual(result["timing_key"], "finance")
        self.assertFalse(result["is_ambiguous"])


if __name__ == "__main__":
    unittest.main()
