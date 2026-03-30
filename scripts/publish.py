# scripts/publish.py
#
# Commits all generated data files and pushes to GitHub.
# Runs as the final step in the GitHub Actions workflow.
# Uses the GITHUB_TOKEN provided by the Actions runner.

import subprocess
import sys
from datetime import datetime, timezone

def run(cmd: list, check: bool = True) -> subprocess.CompletedProcess:
    print(f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    if check and result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    return result

def main():
    now = datetime.now(timezone.utc)
    date_str = now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H:%M UTC')

    # Configure git identity for the Actions bot
    run(['git', 'config', 'user.name',  'yummy-tracker-bot'])
    run(['git', 'config', 'user.email', 'bot@yummywellness.com'])

    # Stage all generated output
    run(['git', 'add', 'data/daily.json'])
    run(['git', 'add', 'data/geo/'])
    run(['git', 'add', 'data/archive/'])

    # Check if there is anything to commit
    status = run(['git', 'status', '--porcelain'], check=False)
    if not status.stdout.strip():
        print("Nothing to commit — data unchanged since last run.")
        return

    commit_msg = f"data: daily update {date_str} at {time_str} [skip ci]"
    run(['git', 'commit', '-m', commit_msg])
    run(['git', 'push'])

    print(f"Published: {commit_msg}")

if __name__ == '__main__':
    main()
