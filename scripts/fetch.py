import json
import time
import requests
from datetime import datetime, timezone, timedelta
from pathlib import Path

HEADERS = {'User-Agent': 'YummyWellnessTracker/1.0'}

# Reddit public JSON — no API key needed
SUBREDDITS = [
    'nutrition', 'health', 'science', 'foodscience',
    'Supplements', 'keto', 'carnivore', 'intermittentfasting',
    'EatCheapAndHealthy', 'longevity', 'veganfitness'
]

# GDELT search terms — global news, no API key needed
GDELT_QUERIES = [
    'nutrition health claim',
    'food safety health',
    'diet disease research',
    'supplement vitamin health',
    'ultra processed food',
    'seed oil health',
    'gut health microbiome',
    'anti-inflammatory diet',
]

KEYWORDS = [
    'causes', 'cures', 'heals', 'prevents', 'toxic', 'dangerous',
    'myth', 'truth', 'proven', 'study shows', 'research', 'scientists',
    'inflammation', 'gut', 'immune', 'cancer', 'heart', 'diabetes',
    'deficiency', 'healthy', 'unhealthy', 'supplement', 'processed',
    'seed oil', 'raw milk', 'organic', 'diet', 'nutrition'
]

def is_claim(text):
    t = text.lower()
    return any(k in t for k in KEYWORDS)

def fetch_reddit():
    claims = []
    for sub in SUBREDDITS:
        try:
            url = f'https://www.reddit.com/r/{sub}/hot.json?limit=25'
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue
            posts = r.json().get('data', {}).get('children', [])
            for p in posts:
                d = p['data']
                age = (datetime.now(timezone.utc).timestamp() - d['created_utc']) / 3600
                if age > 48 or d['score'] < 30:
                    continue
                title = d['title'].strip()
                if not is_claim(title):
                    continue
                claims.append({
                    'source': 'Reddit',
                    'platform': f'r/{sub}',
                    'claim': title[:280],
                    'url': f"https://reddit.com{d['permalink']}",
                    'engagement': d['score'] + (d['num_comments'] * 3),
                    'hours_ago': round(age, 1),
                })
            time.sleep(1)
        except Exception as e:
            print(f'Reddit r/{sub} failed: {e}')
    print(f'Reddit: {len(claims)} claims')
    return claims

def fetch_gdelt():
    claims = []
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=24)
    for query in GDELT_QUERIES:
        try:
            params = {
                'query': query,
                'mode': 'artlist',
                'maxrecords': 10,
                'format': 'json',
                'startdatetime': start.strftime('%Y%m%d%H%M%S'),
                'enddatetime': end.strftime('%Y%m%d%H%M%S'),
            }
            r = requests.get(
                'https://api.gdeltproject.org/api/v2/doc/doc',
                params=params, timeout=15
            )
            if r.status_code != 200:
                continue
            for a in r.json().get('articles', []):
                title = a.get('title', '').strip()
                if not title or not is_claim(title):
                    continue
                claims.append({
                    'source': 'News',
                    'platform': a.get('domain', 'Global news'),
                    'claim': title[:280],
                    'url': a.get('url', ''),
                    'engagement': 40,
                    'hours_ago': 12,
                    'source_country': a.get('sourcecountry', ''),
                })
            time.sleep(0.5)
        except Exception as e:
            print(f'GDELT "{query}" failed: {e}')
    print(f'GDELT: {len(claims)} claims')
    return claims

def deduplicate(claims):
    seen = set()
    unique = []
    for c in claims:
        key = c['claim'].lower()[:60]
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique

def main():
    all_claims = fetch_reddit() + fetch_gdelt()
    unique = deduplicate(all_claims)
    ranked = sorted(unique, key=lambda x: x['engagement'], reverse=True)
    top20 = ranked[:20]
    print(f'Total after dedup: {len(unique)}, taking top {len(top20)}')
    Path('data').mkdir(exist_ok=True)
    with open('data/raw_claims.json', 'w') as f:
        json.dump(top20, f, indent=2)

if __name__ == '__main__':
    main()
