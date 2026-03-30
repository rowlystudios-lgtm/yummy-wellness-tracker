# scripts/build_json.py
#
# Builds:
#   data/daily.json          — full dataset (all regions, all languages)
#   data/geo/US.json         — US-specific top 10, English
#   data/geo/GB.json         — UK-specific top 10, English
#   data/geo/DE.json         — Germany top 10, German
#   data/geo/JP.json         — Japan top 10, Japanese
#   data/geo/FR.json         — France top 10, French
#   data/geo/BR.json         — Brazil top 10, Portuguese
#   data/geo/global.json     — cross-reference comparison file

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

AUTO_APPROVE = os.environ.get('AUTO_APPROVE', 'false').lower() == 'true'

REGION_LANGUAGE_MAP = {
    'US': 'en', 'GB': 'en', 'AU': 'en',
    'DE': 'de',
    'FR': 'fr',
    'JP': 'ja',
    'BR': 'pt', 'PT': 'pt',
    'ES': 'es', 'MX': 'es', 'AR': 'es',
    'KR': 'ko',
    'IN': 'hi',
}

def build_claim_for_region(claim: dict, region: str) -> dict:
    """Extract the right language version for a given region."""
    lang = REGION_LANGUAGE_MAP.get(region, 'en')
    t = claim.get('translations', {}).get(lang) or claim.get('translations', {}).get('en', {})
    regional_score = claim.get('regional_scores', {}).get(region, {})

    return {
        'rank':              claim.get('rank'),
        'score':             regional_score.get('score') or claim.get('score'),
        'score_type':        claim.get('score_type'),
        'claim_tag':         claim.get('claim_tag'),
        'authority_stance':  regional_score.get('authority_stance', ''),
        'claim_display':     t.get('claim_display', ''),
        'verdict':           t.get('verdict', ''),
        'verdict_highlight': t.get('verdict_highlight', ''),
        'brit_take':         t.get('brit_take', ''),
        'score_label':       t.get('score_label', ''),
        'sources':           t.get('sources', []),
        'platform':          claim.get('platform', ''),
        'url':               claim.get('url', ''),
        'hours_ago':         claim.get('hours_ago', 24),
        'global_cooking':    claim.get('global_cooking', {}),
        # Include ALL translations so the app can switch language
        'translations':      claim.get('translations', {}),
        # Include ALL regional scores for the comparison view
        'regional_scores':   claim.get('regional_scores', {}),
    }

def build_geo_file(claims: list, region: str, metadata: dict) -> dict:
    """Build a regional JSON file with the right language as default."""
    lang = REGION_LANGUAGE_MAP.get(region, 'en')
    now = datetime.now(timezone.utc)
    next_refresh = now.replace(hour=11, minute=0, second=0, microsecond=0)
    if next_refresh <= now:
        next_refresh += timedelta(days=1)

    # Filter claims most relevant to this region — primary region first,
    # then fill with global claims
    regional_first = [c for c in claims if c.get('primary_region') == region]
    global_claims  = [c for c in claims if c.get('primary_region') != region]
    ordered = (regional_first + global_claims)[:10]

    return {
        'region':        region,
        'language':      lang,
        'published':     now.isoformat(),
        'next_refresh':  next_refresh.isoformat(),
        'week_headline': metadata.get('week_headline', {}).get(lang)
                      or metadata.get('week_headline', {}).get('en', ''),
        'stats':         metadata.get('global_stats', {}),
        'top10': [build_claim_for_region(c, region) for c in ordered],
    }

def build_global_file(claims: list, metadata: dict) -> dict:
    """The cross-reference file — all countries, all languages, all cooking info."""
    now = datetime.now(timezone.utc)
    return {
        'type':          'global_cross_reference',
        'published':     now.isoformat(),
        'week_headlines': metadata.get('week_headline', {}),
        'stats':          metadata.get('global_stats', {}),
        'claims': [
            {
                'rank':            c.get('rank'),
                'score':           c.get('score'),
                'score_type':      c.get('score_type'),
                'claim_tag':       c.get('claim_tag'),
                'primary_region':  c.get('primary_region'),
                'translations':    c.get('translations', {}),
                'regional_scores': c.get('regional_scores', {}),
                'global_cooking':  c.get('global_cooking', {}),
            }
            for c in claims[:10]
        ],
    }

def main():
    with open('data/scored_claims.json') as f:
        scored = json.load(f)

    claims = scored.get('claims', [])
    approved = [c for c in claims if c.get('editorial_approved') is True] \
               if not AUTO_APPROVE else claims

    if not approved:
        print("No approved claims. Preserving previous output.")
        return

    now = datetime.now(timezone.utc)
    date_str = now.strftime('%Y-%m-%d')

    # Build main daily.json
    daily = {
        'published':   now.isoformat(),
        'week_headline': scored.get('week_headline', {}),
        'stats':         scored.get('global_stats', {}),
        'all_claims':    approved[:20],
    }
    with open('data/daily.json', 'w', encoding='utf-8') as f:
        json.dump(daily, f, indent=2, ensure_ascii=False)

    # Build per-region geo files
    geo_dir = Path('data/geo')
    geo_dir.mkdir(parents=True, exist_ok=True)

    for region in ['US', 'GB', 'DE', 'JP', 'FR', 'BR', 'AU', 'IN', 'KR', 'ES']:
        geo_data = build_geo_file(approved, region, scored)
        path = geo_dir / f'{region}.json'
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(geo_data, f, indent=2, ensure_ascii=False)
        print(f"Built data/geo/{region}.json "
              f"({REGION_LANGUAGE_MAP.get(region, 'en')})")

    # Build global cross-reference file
    global_data = build_global_file(approved, scored)
    with open(geo_dir / 'global.json', 'w', encoding='utf-8') as f:
        json.dump(global_data, f, indent=2, ensure_ascii=False)

    # Archive
    archive_dir = Path('data/archive')
    archive_dir.mkdir(exist_ok=True)
    with open(archive_dir / f'{date_str}.json', 'w', encoding='utf-8') as f:
        json.dump(daily, f, indent=2, ensure_ascii=False)

    print(f"All regional files built for {date_str}")

if __name__ == '__main__':
    main()
