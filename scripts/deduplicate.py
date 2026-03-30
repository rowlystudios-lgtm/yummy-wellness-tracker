# scripts/deduplicate.py
#
# Merges all raw source files, deduplicates by claim similarity,
# and ranks by engagement + recency + source authority.
#
# Input files: data/raw_reddit.json, data/raw_gdelt.json,
#              data/raw_youtube.json, data/raw_rss.json
# Output:      data/ranked_claims.json (top 20 unique claims)

import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# Source authority weights — RSS (official) > YouTube > Reddit > GDELT
SOURCE_WEIGHTS = {
    'rss':     1.5,
    'youtube': 1.2,
    'reddit':  1.0,
    'gdelt':   0.9,
}

# Region priority for deduplication — prefer the most specific regional tag
REGION_PRIORITY = ['JP', 'KR', 'DE', 'FR', 'BR', 'IN', 'AU', 'GB', 'US', 'ES', 'GLOBAL']

def normalise(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace — for fuzzy matching."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def similarity(a: str, b: str) -> float:
    """Simple word-overlap similarity (Jaccard index on word sets)."""
    words_a = set(normalise(a).split())
    words_b = set(normalise(b).split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union)

def load_raw_file(path: str) -> list:
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"  (skipping {path} — not found)")
        return []
    except Exception as e:
        print(f"  Warning: could not load {path}: {e}")
        return []

def deduplicate(claims: list, threshold: float = 0.45) -> list:
    """
    Group claims by similarity. Keep the representative with the highest
    weighted engagement score. Merge engagement totals across duplicates.
    """
    groups = []  # list of lists of similar claims

    for claim in claims:
        placed = False
        for group in groups:
            rep = group[0]
            if similarity(claim['claim'], rep['claim']) >= threshold:
                group.append(claim)
                placed = True
                break
        if not placed:
            groups.append([claim])

    merged = []
    for group in groups:
        # Pick representative: highest weighted engagement
        best = max(group, key=lambda c: c.get('engagement', 0) * SOURCE_WEIGHTS.get(c.get('source', ''), 1.0))

        # Total engagement across all duplicates
        total_engagement = sum(c.get('engagement', 0) for c in group)

        # Best region: most specific non-GLOBAL
        regions = [c.get('region', 'GLOBAL') for c in group if c.get('region') != 'GLOBAL']
        primary_region = regions[0] if regions else 'GLOBAL'
        # Prefer the most specific regional tag based on priority
        for r in REGION_PRIORITY:
            if r in regions:
                primary_region = r
                break

        merged.append({
            **best,
            'total_engagement': total_engagement,
            'duplicate_count': len(group),
            'primary_region': primary_region,
            'sources_seen': list({c.get('source') for c in group}),
        })

    return merged

def score_claim(claim: dict) -> float:
    """Composite ranking score: engagement × source weight × recency."""
    engagement = claim.get('total_engagement', 0)
    source_w   = SOURCE_WEIGHTS.get(claim.get('source', ''), 1.0)
    hours_ago  = max(claim.get('hours_ago', 24), 0.1)
    recency_w  = 1.0 / (1.0 + hours_ago / 12)  # Decay over 12h
    duplicate_bonus = 1.0 + (min(claim.get('duplicate_count', 1), 5) - 1) * 0.1
    is_official = 1.3 if claim.get('is_official') else 1.0
    return engagement * source_w * recency_w * duplicate_bonus * is_official

def main():
    print("Loading raw source files...")
    reddit  = load_raw_file('data/raw_reddit.json')
    gdelt   = load_raw_file('data/raw_gdelt.json')
    youtube = load_raw_file('data/raw_youtube.json')
    rss     = load_raw_file('data/raw_rss.json')

    all_claims = reddit + gdelt + youtube + rss
    print(f"Total raw claims before dedup: {len(all_claims)}")

    if not all_claims:
        print("No claims to process. Exiting.")
        Path('data').mkdir(exist_ok=True)
        with open('data/ranked_claims.json', 'w') as f:
            json.dump([], f)
        return

    print("Deduplicating...")
    unique = deduplicate(all_claims)
    print(f"Unique claims after dedup: {len(unique)}")

    # Rank by composite score
    ranked = sorted(unique, key=score_claim, reverse=True)[:20]

    print(f"Top {len(ranked)} claims selected for scoring")
    for i, c in enumerate(ranked, 1):
        print(f"  {i}. [{c.get('primary_region')}] [{c.get('source')}] "
              f"[eng:{c.get('total_engagement')}] {c['claim'][:80]}")

    Path('data').mkdir(exist_ok=True)
    with open('data/ranked_claims.json', 'w') as f:
        json.dump(ranked, f, indent=2, ensure_ascii=False)

    print(f"Wrote data/ranked_claims.json ({len(ranked)} claims)")

if __name__ == '__main__':
    main()
