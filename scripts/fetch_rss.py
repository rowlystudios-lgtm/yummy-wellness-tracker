# scripts/fetch_rss.py
#
# Official health authority RSS feeds — completely free, no keys.
# Uses requests with explicit timeout to prevent hanging,
# then passes raw XML to feedparser to avoid the default no-timeout behaviour.

import json
import feedparser
import requests
from datetime import datetime, timezone
from pathlib import Path

FETCH_TIMEOUT = 8   # seconds per feed — fail fast, don't hang the pipeline

RSS_FEEDS = {
    'GLOBAL': [
        {'url': 'https://www.who.int/rss-feeds/news-english.xml', 'authority': 'WHO'},
        {'url': 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/food/rss.xml', 'authority': 'FDA'},
    ],
    'US': [
        {'url': 'https://tools.cdc.gov/api/v2/resources/media/316422.rss', 'authority': 'CDC'},
        {'url': 'https://www.nih.gov/news-events/news-releases/feed', 'authority': 'NIH'},
    ],
    'GB': [
        {'url': 'https://www.nhs.uk/news/heart-disease/rss/', 'authority': 'NHS'},
    ],
    'DE': [
        {'url': 'https://www.bfr.bund.de/SharedDocs/RSS/EN/bfr_rss_EN.xml', 'authority': 'BfR'},
    ],
    'FR': [
        {'url': 'https://www.anses.fr/fr/rss.xml', 'authority': 'ANSES'},
    ],
    'AU': [
        {'url': 'https://www.nhmrc.gov.au/about-us/news/nhmrc-news/rss.xml', 'authority': 'NHMRC'},
    ],
}

CLAIM_KEYWORDS = [
    'diet', 'nutrition', 'food', 'health', 'disease', 'cancer', 'heart',
    'diabetes', 'obesity', 'supplement', 'vitamin', 'mineral', 'gut',
    'inflammation', 'study', 'research', 'risk', 'benefit', 'warning',
    'recall', 'safe', 'unsafe', 'guidance', 'advice'
]

HEADERS = {
    'User-Agent': 'YummyWellnessTracker/1.0 (research; contact: hello@yummywellness.com)'
}

def is_health_claim(title: str) -> bool:
    return any(kw.lower() in title.lower() for kw in CLAIM_KEYWORDS)

def fetch_feed(feed_info: dict, region: str) -> list:
    """Fetch with explicit timeout via requests, then parse with feedparser."""
    try:
        resp = requests.get(feed_info['url'], headers=HEADERS, timeout=FETCH_TIMEOUT)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
        claims = []
        for entry in feed.entries[:10]:
            title = entry.get('title', '').strip()
            if not title or not is_health_claim(title):
                continue
            claims.append({
                'source': 'rss',
                'region': region,
                'authority': feed_info['authority'],
                'claim': title[:300],
                'url': entry.get('link', ''),
                'summary': entry.get('summary', '')[:200],
                'engagement': 80,
                'hours_ago': 6,
                'is_official': True,
                'fetched_at': datetime.now(timezone.utc).isoformat(),
            })
        print(f"  RSS {feed_info['authority']} ({region}): {len(claims)} claims")
        return claims
    except requests.Timeout:
        print(f"  RSS {feed_info['authority']} timed out after {FETCH_TIMEOUT}s — skipping")
        return []
    except Exception as e:
        print(f"  RSS {feed_info['authority']} failed: {e}")
        return []

def main():
    all_claims = []
    for region, feeds in RSS_FEEDS.items():
        for feed_info in feeds:
            all_claims.extend(fetch_feed(feed_info, region))

    print(f"Total RSS claims: {len(all_claims)}")
    Path('data').mkdir(exist_ok=True)
    with open('data/raw_rss.json', 'w') as f:
        json.dump(all_claims, f, indent=2)

if __name__ == '__main__':
    main()
