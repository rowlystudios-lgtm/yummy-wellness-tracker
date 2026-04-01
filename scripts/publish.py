import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

def main():
    with open('data/scored_claims.json') as f:
        scored = json.load(f)

    claims = scored.get('claims', [])
    now = datetime.now(timezone.utc)
    next_refresh = (now + timedelta(days=1)).replace(
        hour=11, minute=0, second=0, microsecond=0
    )

    # Build top 10
    top10 = []
    for i, c in enumerate(claims[:10]):
        top10.append({
            'rank':              i + 1,
            'claim':             c.get('claim', ''),
            'source':            c.get('source', ''),
            'platform':          c.get('platform', ''),
            'url':               c.get('url', ''),
            'hours_ago':         c.get('hours_ago', 24),
            'score':             c.get('score', 0),
            'score_label':       c.get('score_label', ''),
            'score_type':        c.get('score_type', 'mixed'),
            'claim_tag':         c.get('claim_tag', ''),
            'verdict':           c.get('verdict', ''),
            'verdict_highlight': c.get('verdict_highlight', ''),
            'sources':           c.get('sources', []),
            'global_opinion':    c.get('global_opinion', ''),
            'brit_take':         c.get('brit_take', ''),
        })

    daily = {
        'published':     now.isoformat(),
        'next_refresh':  next_refresh.isoformat(),
        'week_headline': scored.get('week_headline', ''),
        'stats': {
            'misleading_pct': scored.get('misleading_pct', ''),
            'true_pct':       scored.get('true_pct', ''),
            'total_scored':   len(claims),
        },
        'top10': top10,
    }

    # Write main output
    with open('data/daily.json', 'w') as f:
        json.dump(daily, f, indent=2)

    # Archive
    archive_dir = Path('data/archive')
    archive_dir.mkdir(exist_ok=True)
    date_str = now.strftime('%Y-%m-%d')
    with open(archive_dir / f'{date_str}.json', 'w') as f:
        json.dump(daily, f, indent=2)

    print(f'Published {len(top10)} claims to data/daily.json')
    print(f'Headline: {daily["week_headline"]}')

if __name__ == '__main__':
    main()
