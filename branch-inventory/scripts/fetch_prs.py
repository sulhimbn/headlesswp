#!/usr/bin/env python3
"""Fetch PR metadata (incl. mergeable state) for all PRs via GraphQL, paginated."""
import json
import os
import subprocess
import sys
import time


WORKDIR = os.environ.get("BWINV_WORKDIR", "/tmp/bwinv")
REPO_OWNER = "sulhimbn"
REPO_NAME = "headlesswp"
OUT = WORKDIR + "/prs.json"

QUERY = """
query($owner:String!, $name:String!, $after:String) {
  repository(owner:$owner, name:$name) {
    pullRequests(first:100, after:$after, orderBy:{field:UPDATED_AT, direction:DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        headRefName
        state
        title
        url
        isDraft
        createdAt
        updatedAt
        closedAt
        mergedAt
        mergeable
        mergeStateStatus
        baseRefName
      }
    }
  }
}
"""


def run(after):
    args = [
        "gh", "api", "graphql",
        "-f", f"owner={REPO_OWNER}",
        "-f", f"name={REPO_NAME}",
        "-f", "query=" + QUERY,
    ]
    if after:
        args += ["-f", f"after={after}"]
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr[:500])
    return json.loads(p.stdout)["data"]["repository"]["pullRequests"]


def main():
    all_nodes = {}
    after = None
    for page in range(60):
        for attempt in range(4):
            try:
                res = run(after)
                break
            except Exception as e:  # noqa: BLE001
                print(f"page {page} attempt {attempt} failed: {e}", file=sys.stderr)
                time.sleep(4 * (attempt + 1))
        else:
            print("giving up", file=sys.stderr)
            sys.exit(1)
        for n in res["nodes"]:
            all_nodes[n["number"]] = n
        print(f"page {page}: total {len(all_nodes)}", file=sys.stderr)
        if not res["pageInfo"]["hasNextPage"]:
            break
        after = res["pageInfo"]["endCursor"]
    json.dump(list(all_nodes.values()), open(OUT, "w"), indent=1)
    from collections import Counter
    nodes = list(all_nodes.values())
    print("TOTAL PRs:", len(nodes), Counter(n["state"] for n in nodes), file=sys.stderr)
    openp = [n for n in nodes if n["state"] == "OPEN"]
    print("OPEN:", len(openp), Counter(n["mergeable"] for n in openp), file=sys.stderr)


if __name__ == "__main__":
    main()
