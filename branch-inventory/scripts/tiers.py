#!/usr/bin/env python3
"""Build the recommended deletion-order tiers from the inventory (proposal only)."""
import csv
import json
import os
from collections import Counter, defaultdict


WORKDIR = os.environ.get("BWINV_WORKDIR", "/tmp/bwinv")
D = json.load(open(WORKDIR + "/branch_inventory.json"))
OUT = WORKDIR + "/deletion_tiers.json"

for r in D:
    open_pr = r["open_prs"]
    r["has_open_pr"] = bool(open_pr)
    r["open_pr_conflicting"] = bool(open_pr) and any(
        p["mergeable"] == "CONFLICTING" for p in open_pr)
    r["open_pr_mergeable"] = bool(open_pr) and any(
        p["mergeable"] == "MERGEABLE" for p in open_pr)
    r["_canon"] = r["is_canonical_for_group"]

    if r["has_open_pr"]:
        r["deletion_tier"] = 0 if r["open_pr_mergeable"] else 1
    elif r["_canon"]:
        r["deletion_tier"] = 2
    elif r["category"] in ("empty-no-diff", "superseded"):
        r["deletion_tier"] = 3
    elif r["category"] == "duplicate":
        r["deletion_tier"] = 4
    elif r["category"] == "unclear":
        r["deletion_tier"] = 5
    elif r["category"] == "candidate-salvage":
        r["deletion_tier"] = 6
    else:  # security-review
        r["deletion_tier"] = 7

TIER_NAME = {
    0: "HOLD - open PR, MERGEABLE: merge or close the PR before touching the ref",
    1: "HOLD - open PR, CONFLICTING: decide the PR (fix or close) before touching the ref",
    2: "PROTECT - no open PR, but canonical of a duplicate group: last surviving record of a shared change",
    3: "Tier A - SAFE TO DELETE: no open PR and the change is already on main",
    4: "Tier B - no open PR, non-canonical duplicate: delete once Tier A is done",
    5: "Tier C - no open PR, class unclear (merge conflicts or trivial diff): human eyeball",
    6: "Tier D - no open PR, candidate-salvage: needs a real salvage decision",
    7: "Tier E - no open PR, security-review: security triage before any deletion",
}
tiers = defaultdict(list)
for r in D:
    r["deletion_tier_name"] = TIER_NAME[r["deletion_tier"]]
    tiers[r["deletion_tier"]].append(r["branch"])

out = {
    "repo": "sulhimbn/headlesswp",
    "generated": "2026-09-29",
    "base": "origin/main",
    "branch_count": len(D),
    "disclaimer": "PROPOSAL ONLY. Nothing was deleted, merged, closed or pushed to main.",
    "tiers": {
        str(k): {
            "name": TIER_NAME[k],
            "count": len(v),
            "branches": sorted(v),
        } for k, v in sorted(tiers.items())
    },
}
json.dump(out, open(OUT, "w"), indent=1)

# add the tier as a CSV column
rows = list(csv.DictReader(open(WORKDIR + "/branch_inventory.csv")))
cols = list(rows[0].keys())
cols.insert(2, "deletion_tier")
cols.insert(3, "deletion_tier_name")
idx = {r["branch"]: r for r in D}
for r in rows:
    r["deletion_tier"] = idx[r["branch"]]["deletion_tier"]
    r["deletion_tier_name"] = idx[r["branch"]]["deletion_tier_name"]
with open(WORKDIR + "/branch_inventory.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=cols, quoting=csv.QUOTE_ALL)
    w.writeheader()
    w.writerows(rows)
# mirror into json
for r in D:
    r["deletion_tier"] = idx[r["branch"]]["deletion_tier"]
    r["deletion_tier_name"] = idx[r["branch"]]["deletion_tier_name"]
json.dump(D, open(WORKDIR + "/branch_inventory.json", "w"), indent=1)

print("wrote", OUT)
for k, v in sorted(out["tiers"].items()):
    print(f"  tier {k}: {v['count']:4d}  {v['name']}")
