"""Conservative URL-only preflight checks.

These indicators are intentionally NOT passed to the PhiUSIIL-trained models:
the notebook does not define a compatible raw-URL-to-53-feature extractor.
"""
from ipaddress import ip_address
import re
from urllib.parse import urlsplit, unquote

SUSPICIOUS_TERMS = {
    "account", "banking", "confirm", "credential", "login", "password",
    "recover", "secure", "signin", "support", "update", "verify", "wallet",
}


def analyze_url(raw_url: str) -> dict:
    value = raw_url.strip()
    if not value:
        raise ValueError("Enter a URL to analyze.")
    if any(ch.isspace() for ch in value):
        raise ValueError("The URL cannot contain whitespace.")
    if not re.match(r"^https?://", value, flags=re.IGNORECASE):
        raise ValueError("Include http:// or https:// at the beginning of the URL.")

    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        # Accessing .port also validates malformed port values.
        _ = parsed.port
    except ValueError as exc:
        raise ValueError("The URL format is invalid.") from exc

    if parsed.scheme.lower() not in {"http", "https"} or not hostname:
        raise ValueError("Enter a valid HTTP or HTTPS URL with a hostname.")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("URLs containing embedded username/password credentials are not accepted.")

    try:
        ascii_host = hostname.encode("idna").decode("ascii").lower()
    except UnicodeError as exc:
        raise ValueError("The hostname could not be parsed safely.") from exc

    try:
        ip_address(ascii_host.strip("[]"))
        is_ip = True
    except ValueError:
        is_ip = False

    decoded = unquote(value).lower()
    labels = [part for part in ascii_host.split(".") if part]
    flags = []
    if is_ip:
        flags.append({"code": "IP_HOST", "label": "Uses an IP address instead of a domain", "severity": "high"})
    if "xn--" in ascii_host:
        flags.append({"code": "PUNYCODE", "label": "Contains an internationalized/punycode hostname", "severity": "medium"})
    if "@" in value:
        flags.append({"code": "AT_SYMBOL", "label": "Contains an @ symbol that can obscure the destination", "severity": "medium"})
    if len(value) > 75:
        flags.append({"code": "LONG_URL", "label": "Unusually long URL", "severity": "low"})
    if not is_ip and len(labels) >= 4:
        flags.append({"code": "MANY_SUBDOMAINS", "label": "Contains multiple subdomain levels", "severity": "medium"})
    if re.search(r"%[0-9a-fA-F]{2}", value):
        flags.append({"code": "ENCODED_CHARS", "label": "Contains percent-encoded characters", "severity": "low"})
    if "-" in ascii_host:
        flags.append({"code": "HYPHENATED_HOST", "label": "Hostname contains hyphens", "severity": "low"})

    matched_terms = sorted(term for term in SUSPICIOUS_TERMS if re.search(rf"(?<![a-z]){re.escape(term)}(?![a-z])", decoded))
    if matched_terms:
        flags.append({"code": "SENSITIVE_KEYWORDS", "label": "Contains words commonly abused in phishing lures", "severity": "low", "matches": matched_terms})

    # URL-only observations; these are not asserted to reproduce PhiUSIIL columns.
    observations = {
        "scheme": parsed.scheme.lower(),
        "hostname": ascii_host,
        "url_length": len(value),
        "uses_https": parsed.scheme.lower() == "https",
        "host_is_ip_address": is_ip,
        "subdomain_label_count": 0 if is_ip else max(0, len(labels) - 2),
        "has_query_string": bool(parsed.query),
        "has_fragment": bool(parsed.fragment),
        "percent_encoded_character_present": bool(re.search(r"%[0-9a-fA-F]{2}", value)),
    }
    return {
        "submitted_url": value,
        "status": "PRELIMINARY_INDICATORS_ONLY",
        "model_prediction": None,
        "risk_indicator_count": len(flags),
        "indicators": flags,
        "observations": observations,
        "disclaimer": (
            "These transparent URL-pattern indicators are not a trained BIEL-PD prediction. "
            "No webpage was fetched. A phishing verdict requires the complete, dataset-compatible "
            "53-feature vector used by the research models."
        ),
    }
