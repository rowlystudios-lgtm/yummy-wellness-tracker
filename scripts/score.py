import json
import os
from datetime import datetime, timezone
from pathlib import Path
import anthropic

SYSTEM_PROMPT = """
You are the fact-checking engine for Yummy Wellness Company.

You score trending health and nutrition claims from Reddit and global news
against peer-reviewed scientific evidence.

SCORING:
- 85-100: Well supported by strong peer-reviewed evidence
- 40-84:  Partially true, overstated, or context-dependent
- 0-39:   Misleading, false, or unsupported

RULES:
1. Never validate conspiracy framing ("doctors hiding this").
   Debunk the claim calmly. No drama.
2. Never shame people who believed the claim.
3. Always cite real sources: CDC, WHO, NHS, Harvard, BMJ, Lancet,
   JAMA, NEJM, Journal of Nutrition, Food Chemistry, EFSA, NIH.
4. Acknowledge genuine nuance — partially true = nuanced score.
5. Tone: warm, direct, plain English. Friend at dinner, not academic paper.
6. For global_opinion: briefly describe how different countries or regions
   view this claim differently — cultural, regulatory, or scientific differences.
   Keep it to 2-3 sentences covering 2-3 countries/regions.

Return ONLY valid JSON, no markdown, no backticks:
{
  "week_headline": "<one sentence about what's dominating health discussion this week>",
  "misleading_pct": "<number>%",
  "true_pct": "<number>%",
  "claims": [
    {
      "score": <0-100>,
      "score_label": "Misleading" | "Nuanced" | "Well supported",
      "score_type": "false" | "mixed" | "true",
      "claim_tag": "Conspiracy framing" | "Partially true" | "Evidence-based" | "Overstated" | "Context missing",
      "verdict": "<2-3 sentences. Plain English. Warm. Never alarmist.>",
      "verdict_highlight": "<the single most important phrase — max 8 words>",
      "sources": ["source 1", "source 2"],
      "global_opinion": "<how different countries/regions view this claim differently — 2-3 sentences>",
      "brit_take": "<one warm, dry observation. Max 2 sentences. From shared experience.>"
    }
  ]
}
"""

def main():
    with open('data/raw_claims.json') as f:
        claims = json.load(f)

    if not claims:
        print('No claims to score.')
        return

    lines = []
    for i, c in enumerate(claims, 1):
        lines.append(f'{i}. [{c["source"]}] "{c["claim"]}"')

    user_msg = (
        f'Score these {len(claims)} trending nutrition and health claims '
        f'from Reddit and global news. Generate the week headline and stats.\n\n'
        + '\n'.join(lines)
        + '\n\nReturn the complete JSON.'
    )

    print(f'Scoring {len(claims)} claims...')

    client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
    response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=8192,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_msg}],
    )

    raw = response.content[0].text.strip()
    raw = raw.removeprefix('```json').removeprefix('```').removesuffix('```').strip()
    result = json.loads(raw)

    # Merge original source data back in
    for i, scored in enumerate(result.get('claims', [])):
        if i < len(claims):
            scored['source']     = claims[i].get('source', '')
            scored['platform']   = claims[i].get('platform', '')
            scored['url']        = claims[i].get('url', '')
            scored['claim']      = claims[i].get('claim', '')
            scored['hours_ago']  = claims[i].get('hours_ago', 24)
            scored['engagement'] = claims[i].get('engagement', 0)

    Path('data').mkdir(exist_ok=True)
    with open('data/scored_claims.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f'Scored {len(result.get("claims", []))} claims')
    print(f'Headline: {result.get("week_headline", "")}')

if __name__ == '__main__':
    main()
