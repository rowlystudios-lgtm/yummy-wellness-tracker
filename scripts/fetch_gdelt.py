# scripts/fetch_gdelt.py
#
# GDELT monitors global news in 65 languages, completely free.
# No API key, no account, no approval.
# This is the international backbone of the system.
#
# GDELT DOC API endpoint:
# https://api.gdeltproject.org/api/v2/doc/doc?query=KEYWORDS&mode=artlist&maxrecords=25&format=json
#
# What makes GDELT special for this product:
# - Covers news from 65 countries in their native languages
# - Machine-translates to English automatically
# - Preserves source country and language metadata
# - Identifies health/food/nutrition themes automatically via its knowledge graph
# - A story trending in Japanese media appears here even if Reddit ignores it

import json
import time
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc'

# Search queries per region — in English (GDELT translates from all languages)
# Trimmed to 2 queries per region — reduces GDELT runtime from ~10min to ~3min
REGIONAL_QUERIES = {
    'US': [
        'seed oil health inflammation',
        'ultra processed food disease',
    ],
    'GB': [
        'NHS food nutrition health UK',
        'British diet health obesity',
    ],
    'DE': [
        'Ernaehrung Gesundheit Deutschland',
        'German food health nutrition',
    ],
    'JP': [
        'Japan diet health longevity',
        'fermented food Japan health',
    ],
    'FR': [
        'alimentation sante France',
        'French diet paradox health',
    ],
    'BR': [
        'alimentacao saude Brasil',
        'dieta brasileira saude',
    ],
    'IN': [
        'Ayurveda food health India',
        'turmeric curcumin India',
    ],
    'GLOBAL': [
        'nutrition health claim viral',
        'WHO nutrition guidelines',
    ]
}

CLAIM_KEYWORDS = [
    'causes', 'cure', 'heals', 'prevents', 'toxic', 'dangerous', 'myth',
    'proven', 'study', 'research', 'health benefit', 'inflammation',
    'cancer risk', 'heart', 'diabetes', 'diet', 'nutrition', 'supplement',
    'processed', 'organic', 'natural', 'traditional'
]

def is_health_claim(title: str) -> bool:
    return any(kw.lower() in title.lower() for kw in CLAIM_KEYWORDS)

def fetch_gdelt_region(query: str, region: str) -> list:
    # Last 24 hours
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=24)

    params = {
        'query': query,
        'mode': 'artlist',
        'maxrecords': 25,
        'format': 'json',
        'startdatetime': start.strftime('%Y%m%d%H%M%S'),
        'enddatetime': end.strftime('%Y%m%d%H%M%S'),
        'sort': 'hybridrel',
    }

    try:
        time.sleep(2)  # Respect GDELT rate limits
        resp = requests.get(GDELT_API, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        articles = data.get('articles', [])
        claims = []

        for article in articles:
            title = article.get('title', '').strip()
            if not title or not is_health_claim(title):
                continue

            claims.append({
                'source': 'gdelt',
                'region': region,
                'language': article.get('language', 'English'),
                'source_country': article.get('sourcecountry', region),
                'claim': title[:300],
                'url': article.get('url', ''),
                'domain': article.get('domain', ''),
                'seendate': article.get('seendate', ''),
                'engagement': 50,  # GDELT doesn't give engagement — weight equally
                'hours_ago': 12,
                'fetched_at': datetime.now(timezone.utc).isoformat(),
            })
        return claims

    except Exception as e:
        print(f"Warning: GDELT query '{query[:40]}' failed: {e}")
        return []

def main():
    all_claims = []
    for region, queries in REGIONAL_QUERIES.items():
        for query in queries:
            claims = fetch_gdelt_region(query, region)
            all_claims.extend(claims)
            print(f"  GDELT '{query[:40]}' ({region}): {len(claims)} articles")

    print(f"Total GDELT claims: {len(all_claims)}")
    Path('data').mkdir(exist_ok=True)
    with open('data/raw_gdelt.json', 'w') as f:
        json.dump(all_claims, f, indent=2)

if __name__ == '__main__':
    main()
