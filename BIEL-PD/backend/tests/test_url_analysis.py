import unittest
from backend.app.url_analysis import analyze_url


class URLPreflightTests(unittest.TestCase):
    def test_basic_https_url_has_no_indicators(self):
        result = analyze_url('https://example.com')
        self.assertEqual(result['risk_indicator_count'], 0)
        self.assertIsNone(result['model_prediction'])

    def test_ip_and_keyword_indicators_are_reported(self):
        result = analyze_url('http://192.0.2.10/login/verify')
        codes = {item['code'] for item in result['indicators']}
        self.assertIn('IP_HOST', codes)
        self.assertIn('SENSITIVE_KEYWORDS', codes)
        self.assertNotIn('MANY_SUBDOMAINS', codes)

    def test_requires_http_or_https(self):
        with self.assertRaises(ValueError):
            analyze_url('example.com')

    def test_rejects_embedded_credentials(self):
        with self.assertRaises(ValueError):
            analyze_url('https://user:password@example.com')


if __name__ == '__main__':
    unittest.main()
