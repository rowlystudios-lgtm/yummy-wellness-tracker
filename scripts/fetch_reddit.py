# scripts/fetch_reddit.py
#
# Uses Reddit's public JSON feed — no API key, no approval needed.
# Each subreddit has a public endpoint: reddit.com/r/[name]/hot.json
#
# Regional subreddits monitored per country:
# US: r/nutrition, r/health, r/Supplements, r/keto, r/carnivore
# UK: r/AskUK (health threads), r/CPTSD (food/mental health)
# Germany: r/de (health threads), r/Fitness (German)
# Japan: Limited Reddit presence — GDELT covers Japan better
# France: r/france (health threads)
# Brazil: r/brasil (health threads)
# Global: r/science, r/longevity, r/foodscience, r/intermittentfasting

import json
import time
import requests
from datetime import datetime, timezone
from pathlib import Path

HEADERS = {
    'User-Agent': 'YummyWellnessTracker/1.0 (research; contact: hello@yummywellness.com)'
}

# Regional subreddit mapping
REGIONAL_SUBREDDITS = {
    'US': ['nutrition', 'health', 'Supplements', 'keto', 'carnivore',
           'intermittentfasting', 'loseit', 'Fitness'],
    'GB': ['AskUK', 'unitedkingdom', 'BritishHealth', 'veganuk'],
    'DE': ['de', 'Fitness', 'ernaehrung', 'gesundheit'],
    'FR': ['france', 'nutrition', 'vegan'],
    'BR': ['brasil', 'saudavel', 'fitness'],
    'AU': ['australia', 'AusHealthcare', 'nutrition'],
    'IN': ['india', 'indianfitness', 'Ayurveda'],
    'GLOBAL': ['science', 'foodscience', 'longevity', 'plantbased',
               'veganfitness', 'EatCheapAndHealthy']
}

CLAIM_KEYWORDS = [
    'causes', 'cures', 'heals', 'reverses', 'prevents', 'toxic', 'dangerous',
    'linked to', 'proven', 'study shows', 'research says', 'scientists found',
    'actually', 'myth', 'truth about', 'inflammation', 'gut health',
    'immune system', 'cancer', 'heart disease', 'diabetes', 'deficiency',
    'healthy', 'unhealthy', 'good for you', 'bad for you', 'supplement',
    'processed food', 'ultra-processed', 'seed oil', 'raw milk', 'organic'
]

def is_health_claim(text: str) -> bool:
    return any(kw.lower() in text.lower() for kw in CLAIM_KEYWORDS)

def fetch_subreddit(subreddit: str, region: str) -> list:
    url = f'https://www.reddit.com/r/{subreddit}/hot.json?limit=50'
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        posts = data.get('data', {}).get('children', [])
        claims = []
        for post in posts:
            p = post['data']
            age_hours = (datetime.now(timezone.utc).timestamp() - p['created_utc']) / 3600
            if age_hours > 48: continue
            if p['score'] < 30: continue
            title = p['title'].strip()
            if not is_health_claim(title): continue
            claims.append({
                'source': 'reddit',
                'region': region,
                'subreddit': subreddit,
                'claim': title[:300],
                'url': f"https://reddit.com{p['permalink']}",
                'upvotes': p['score'],
                'comments': p['num_comments'],
                'engagement': p['score'] + (p['num_comments'] * 3),
                'hours_ago': round(age_hours, 1),
                'fetched_at': datetime.now(timezone.utc).isoformat(),
            })
        time.sleep(1.5)  # Be polite — public feed has rate limits
        return claims
    except Exception as e:
        print(f"Warning: r/{subreddit} failed: {e}")
        return []

def main():
    all_claims = []
    for region, subreddits in REGIONAL_SUBREDDITS.items():
        for sub in subreddits:
            claims = fetch_subreddit(sub, region)
            all_claims.extend(claims)
            print(f"  r/{sub} ({region}): {len(claims)} claims")

    print(f"Total Reddit claims: {len(all_claims)}")
    Path('data').mkdir(exist_ok=True)
    with open('data/raw_reddit.json', 'w') as f:
        json.dump(all_claims, f, indent=2)

if __name__ == '__main__':
    main()
