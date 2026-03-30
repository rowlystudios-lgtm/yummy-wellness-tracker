# scripts/fetch_youtube.py
#
# Fetches trending health/nutrition videos from YouTube Data API v3.
# Free tier: 10,000 units/day. A search costs 100 units.
# So this script uses ~500 units/day — well within free tier.
#
# Requires: YOUTUBE_API_KEY env var (free from console.cloud.google.com)
# If no key is set, script exits gracefully with empty output.

import json
import os
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

# Health/nutrition search queries per region
REGIONAL_QUERIES = {
    'US': [
        'seed oil health 2025',
        'raw milk benefits dangers',
        'ultra processed food study',
        'carnivore diet results',
    ],
    'GB': [
        'NHS nutrition advice 2025',
        'UK diet health study',
    ],
    'DE': [
        'Ernährung Gesundheit 2025',
        'Lebensmittel Mythen Deutschland',
    ],
    'JP': [
        '日本食 健康 研究',
        '発酵食品 効果',
    ],
    'FR': [
        'alimentation santé France 2025',
        'régime paradoxe français',
    ],
    'BR': [
        'alimentação saudável Brasil 2025',
        'dieta brasileira pesquisa',
    ],
    'GLOBAL': [
        'nutrition myth debunked 2025',
        'food health claim viral',
        'WHO diet guidelines',
    ],
}

CLAIM_KEYWORDS = [
    'causes', 'cure', 'heals', 'prevents', 'toxic', 'dangerous', 'myth',
    'proven', 'study', 'research', 'health', 'inflammation', 'cancer',
    'heart', 'diabetes', 'diet', 'nutrition', 'supplement', 'processed',
    'organic', 'natural', 'benefits', 'risks', 'truth'
]

def is_health_claim(title: str) -> bool:
    return any(kw.lower() in title.lower() for kw in CLAIM_KEYWORDS)

def fetch_youtube_query(query: str, region: str, api_key: str) -> list:
    published_after = (datetime.now(timezone.utc) - timedelta(hours=48)).strftime('%Y-%m-%dT%H:%M:%SZ')

    params = {
        'part': 'snippet',
        'q': query,
        'type': 'video',
        'order': 'relevance',
        'maxResults': 10,
        'publishedAfter': published_after,
        'key': api_key,
    }

    try:
        resp = requests.get(f'{YOUTUBE_API}/search', params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        items = data.get('items', [])
        claims = []

        for item in items:
            snippet = item.get('snippet', {})
            title = snippet.get('title', '').strip()
            if not title or not is_health_claim(title):
                continue

            video_id = item.get('id', {}).get('videoId', '')
            claims.append({
                'source': 'youtube',
                'region': region,
                'claim': title[:300],
                'url': f'https://www.youtube.com/watch?v={video_id}',
                'channel': snippet.get('channelTitle', ''),
                'description': snippet.get('description', '')[:200],
                'published_at': snippet.get('publishedAt', ''),
                'engagement': 60,  # YouTube view count not available in search — weight moderately
                'hours_ago': 24,
                'fetched_at': datetime.now(timezone.utc).isoformat(),
            })

        return claims

    except Exception as e:
        print(f"Warning: YouTube query '{query[:40]}' failed: {e}")
        return []

def main():
    api_key = os.environ.get('YOUTUBE_API_KEY', '')
    if not api_key:
        print("YOUTUBE_API_KEY not set — skipping YouTube fetch")
        Path('data').mkdir(exist_ok=True)
        with open('data/raw_youtube.json', 'w') as f:
            json.dump([], f)
        return

    all_claims = []
    for region, queries in REGIONAL_QUERIES.items():
        for query in queries:
            claims = fetch_youtube_query(query, region, api_key)
            all_claims.extend(claims)
            print(f"  YouTube '{query[:40]}' ({region}): {len(claims)} videos")

    print(f"Total YouTube claims: {len(all_claims)}")
    Path('data').mkdir(exist_ok=True)
    with open('data/raw_youtube.json', 'w') as f:
        json.dump(all_claims, f, indent=2)

if __name__ == '__main__':
    main()
