#!/usr/bin/env python3
"""Classify the 425 unmerged headlesswp branches; emit CSV + JSON + duplicate groups.

READ-ONLY with respect to the repository working tree and all refs.
"""
import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict


WORKDIR = os.environ.get("BWINV_WORKDIR", "/tmp/bwinv")
TODAY = "2026-09-29"
RAW = WORKDIR + "/raw.json"
PRS = WORKDIR + "/prs.json"
OUT_CSV = WORKDIR + "/branch_inventory.csv"
OUT_JSON = WORKDIR + "/branch_inventory.json"
OUT_DUP = WORKDIR + "/duplicate_groups.json"

# ------------------------------------------------------------------ path flags
PATH_FLAGS = [
    ("package_json", re.compile(r"^package\.json$")),
    ("lockfile", re.compile(r"^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$")),
    ("next_config", re.compile(r"(^|/)next\.config\.(js|mjs|ts)$")),
    ("env", re.compile(r"(^|/)\.env(\.|$)")),
    ("auth", re.compile(r"auth(?!or)", re.I)),
    ("middleware", re.compile(r"middleware", re.I)),
    ("dockerfile", re.compile(r"(^|/)Dockerfile", re.I)),
    ("docker_compose", re.compile(r"(^|/)docker-compose", re.I)),
    ("sentry_config", re.compile(r"(^|/)sentry\.[a-z]*\.config\.ts$")),
    ("security_workflow", re.compile(r"\.github/workflows/.*(security|codeql|snyk)", re.I)),
    ("security_path", re.compile(r"security", re.I)),
    ("ci_workflow", re.compile(r"^\.github/workflows/", re.I)),
    ("dependabot_config", re.compile(r"(^|/)\.github/dependabot\.yml$", re.I)),
]
# "core" security-sensitive set, per the bead's list
SEC_CORE = ("env", "auth", "middleware", "dockerfile", "docker_compose",
            "security_workflow", "security_path", "sentry_config", "next_config")

STRONG_SEC_SUBJECT = re.compile(
    r"(cve-\d{4}-\d+|ghsa-[0-9a-z-]+|npm audit|vulnerab|security|xss|csrf|injection|"
    r"sanitiz|secret|credential|harden|advisory|auth(?!or)entication|privilege|"
    r"path traversal|encrypt|rate.?limit|allowlist|denylist)",
    re.I,
)
NAME_SEC = re.compile(
    r"(securit|cve|vuln|npm-audit|audit|sec-\d|sec\b|sanitiz|harden|rate.?limit|auth(?!or))",
    re.I,
)
DEPENDABOT_SUBJECT = re.compile(
    r"^\s*(build|chore|fix|feat)?\(?deps\)?(!)?:.*\bbump\b|^\s*bump\s+\S+\s+from\s+", re.I
)

PREFIXES = (
    "fix", "feat", "feature", "test", "chore", "dx", "qa", "docs", "security",
    "automation", "pr", "arch", "e2e", "improvements", "hotfix", "build",
    "dependabot", "refactor", "perf", "ci", "audit", "infra", "dev",
)
# machine-generated, non-descriptive names: never pick one as the canonical record
OPAQUE_NAME = re.compile(
    r"^(pr[-_]?\d+|sulhimbn-patch[-_]?\d*|tmp|test[-_]?\d+|wip|patch[-_]?\d+|"
    r"auto[-_]?\d*|branch[-_]?\d+|new[-_]?branch|untitled|commit.*)$", re.I
)

SEC_TOUCH_LINES = 20  # "substantive" threshold

TEST_PATH = re.compile(
    r"(^|/)(__tests__|tests?|e2e|spec)/|\.(test|spec)\.[cm]?[jt]sx?$", re.I
)


def is_test_path(p):
    return bool(TEST_PATH.search(p))


def norm_name(b):
    s = b.lower().replace("__", "-").replace("_", "-").replace(" ", "-")
    s = re.sub(r"^dependabot/[a-z_]+/[^/]+/", "", s)
    s = re.sub(r"^dependabot/", "", s)
    prev = None
    while prev != s:
        prev = s
        for p in PREFIXES:
            if s.startswith(p + "-") or s.startswith(p + "/"):
                s = s[len(p) + 1:]
                break
    s = re.sub(r"-(issue|issues|sec|security|build|story|task|gh)-?\d*", "", s)
    s = re.sub(r"^(issue|issues|sec|security|build)-\d+-?", "", s)
    s = re.sub(r"-\d{3,}$", "", s)
    s = re.sub(r"-[vv]?\d+$", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-") or b.lower()


def norm_subject(s):
    s = s.lower()
    s = re.sub(r"\(#[0-9]+\)", "", s)
    s = re.sub(r"#[0-9]+", "", s)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


def jaccard(a, b):
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def days_between(datestr):
    import datetime
    try:
        return (datetime.date.fromisoformat(TODAY) - datetime.date.fromisoformat(datestr)).days
    except Exception:  # noqa: BLE001
        return ""


class UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


# ------------------------------------------------------------------ flagging
def apply_flags(recs, prs):
    pr_by_branch = defaultdict(list)
    for p in prs:
        pr_by_branch[p["headRefName"]].append(p)

    for r in recs:
        paths = [f["path"] for f in r["files"]]
        pf = {}
        for key, rx in PATH_FLAGS:
            hits = [p for p in paths if rx.search(p)]
            if hits:
                pf[key] = hits
        r["path_flags"] = pf
        r["touches_security_files"] = any(
            k in pf for k in ("package_json", "lockfile") + SEC_CORE
        )
        r["touches_core_security_path"] = any(k in pf for k in SEC_CORE)

        # Substantive security-sensitive edit: >= SEC_TOUCH_LINES changed lines.
        # Test files are excluded from the line count - a branch that only adds
        # __tests__/middlewareSecurity.test.ts is not making a security change.
        r["sec_sensitive_paths"] = sorted(k for k in SEC_CORE if k in pf)
        r["sec_sensitive_lines"] = sum(
            f["ins"] + f["del"]
            for f in r["files"]
            if not is_test_path(f["path"])
            and any(PATH_FLAGS_DICT[k].search(f["path"]) for k in r["sec_sensitive_paths"])
        )
        r["sec_sensitive_test_lines"] = sum(
            f["ins"] + f["del"]
            for f in r["files"]
            if is_test_path(f["path"])
            and any(PATH_FLAGS_DICT[k].search(f["path"]) for k in r["sec_sensitive_paths"])
        )
        r["sec_sensitive_substantive"] = r["sec_sensitive_lines"] >= SEC_TOUCH_LINES

        own = r["own_subjects"] or r["subjects"]
        r["own_subjects_used"] = own
        r["strong_sec_commits"] = [s for s in own if STRONG_SEC_SUBJECT.search(s)]
        r["strong_sec_ratio"] = round(len(r["strong_sec_commits"]) / len(own), 3) if own else 0.0
        r["strong_security_subject"] = bool(r["strong_sec_commits"])
        r["tip_is_security"] = bool(own and STRONG_SEC_SUBJECT.search(own[0]))
        r["branch_name_security"] = bool(NAME_SEC.search(r["branch"]))
        r["security_subject_samples"] = r["strong_sec_commits"][:5]

        r["security_intent"] = bool(
            r["branch_name_security"] or r["tip_is_security"] or r["strong_sec_ratio"] >= 0.6
        )
        r["deps_only"] = set(paths) <= {"package.json", "package-lock.json"}

        r["dependabot_branch"] = r["branch"].lower().startswith("dependabot/")
        r["dependabot_paths"] = "dependabot_config" in pf
        r["dependabot_commit_subject"] = any(DEPENDABOT_SUBJECT.search(s) for s in own)
        r["is_dependabot_generated"] = bool(
            r["dependabot_branch"] or r["dependabot_paths"] or r["dependabot_commit_subject"]
        )

        r["norm_name"] = norm_name(r["branch"])
        r["subject_set"] = {norm_subject(s) for s in r["subjects"]}
        r["own_subject_set"] = {norm_subject(s) for s in own}
        r["content_set"] = {ln.split("\0")[0] for ln in r["content_fp"].split("\n") if ln}
        r["days_stale"] = days_between(r["last_commit_date_short"])
        r["primary_top_dir"] = (
            "src/" if "src" in r["top_dirs"]
            else (r["top_dirs_list"][0] if r["top_dirs_list"] else "(none)")
        )

        pl = pr_by_branch.get(r["branch"], [])
        op = [p for p in pl if p["state"] == "OPEN"]
        r["prs_all"] = pl
        r["prs_open"] = op
        r["p0"] = (op or pl or [None])[0]
    return pr_by_branch


PATH_FLAGS_DICT = dict(PATH_FLAGS)


# ------------------------------------------------------------------ duplicates
def find_duplicates(recs):
    n = len(recs)
    uf, reason = UF(n), defaultdict(set)

    def link(i, j, why):
        uf.union(i, j)
        reason[uf.find(i)].add(why)

    by_tip, by_fp, by_name = defaultdict(list), defaultdict(list), defaultdict(list)
    for i, r in enumerate(recs):
        by_tip[r["tip_sha"]].append(i)
        by_fp[r["content_fp"]].append(i)
        by_name[r["norm_name"]].append(i)
    for grp in by_tip.values():
        for a, b in zip(grp, grp[1:]):
            link(a, b, "identical tip commit")
    for grp in by_fp.values():
        for a, b in zip(grp, grp[1:]):
            link(a, b, "identical content fingerprint (same net change)")
    for grp in by_name.values():
        for a in grp:
            for b in grp:
                if a < b:
                    sj = jaccard(recs[a]["subject_set"], recs[b]["subject_set"])
                    cj = jaccard(recs[a]["content_set"], recs[b]["content_set"])
                    if sj >= 0.5 or cj >= 0.5:
                        link(a, b,
                             f"near-identical after name normalisation "
                             f"(subjectJ={sj:.2f}, contentJ={cj:.2f})")

    groups = defaultdict(list)
    for i in range(n):
        groups[uf.find(i)].append(i)
    dup_groups = [g for g in groups.values() if len(g) > 1]

    def rank(i):
        """Lower is better. Newest commit wins; then a descriptive name; then
        lowercase; then shorter; then alphabetical. Not a quality judgement."""
        r = recs[i]
        import datetime
        try:
            ord_ = -datetime.date.fromisoformat(r["last_commit_date_short"]).toordinal()
        except Exception:  # noqa: BLE001
            ord_ = 0
        opaque = 1 if OPAQUE_NAME.match(r["branch"]) else 0
        return (ord_, opaque,
                0 if r["branch"] == r["branch"].lower() else 1,
                -len(r["branch"]), r["branch"])

    sizes = {id(g): len(g) for g in dup_groups}
    dup_of, dup_group_id = {}, {}
    dup_meta = []
    for gi, g in enumerate(sorted(dup_groups, key=lambda g: -len(g)), start=1):
        canon_i = sorted(g, key=rank)[0]
        canon = recs[canon_i]["branch"]
        gid = f"DUP-{gi:03d}"
        for i in g:
            dup_of[i] = canon
            dup_group_id[i] = gid
        dup_meta.append({
            "group_id": gid,
            "size": len(g),
            "canonical_branch": canon,
            "canonical_rule": "newest last-commit date, then lowercase name, then shortest, then A-Z",
            "canonical_tip": recs[canon_i]["tip_sha"],
            "canonical_date": recs[canon_i]["last_commit_date_short"],
            "canonical_insertions": recs[canon_i]["insertions"],
            "canonical_files": recs[canon_i]["files_changed"],
            "canonical_category": "",
            "matched_on": sorted(reason[uf.find(canon_i)]),
            "branches": sorted(recs[i]["branch"] for i in g),
            "insertions_if_all_kept": sum(recs[i]["insertions"] for i in g),
            "open_pr_numbers": sorted(p["number"] for i in g for p in recs[i]["prs_open"]),
        })
    sizes_by_gid = {m["group_id"]: m["size"] for m in dup_meta}
    for i, r in enumerate(recs):
        r["is_duplicate"] = i in dup_of
        r["duplicate_of"] = dup_of.get(i, "")
        r["duplicate_group_id"] = dup_group_id.get(i, "")
        r["duplicate_group_size"] = sizes_by_gid.get(r["duplicate_group_id"], 1)
        r["is_canonical_for_group"] = bool(
            r["duplicate_group_id"] and r["duplicate_of"] == r["branch"]
        )
    return dup_meta


# ------------------------------------------------------------------ categories
def classify(r):
    if r["files_changed"] == 0:
        return "empty-no-diff", "no file differences against origin/main"

    # ---- superseded (evaluated first for the already-landed case: nothing to review)
    if r["content_fully_in_main"]:
        return "superseded", (
            f"all {r['files_changed']} touched file(s) already have byte-identical content "
            f"on origin/main - the change already landed"
        )
    if r["modified_missing_on_main"] or r["deleted_missing_on_main"]:
        n = len(r["modified_missing_on_main"]) + len(r["deleted_missing_on_main"])
        ex = (r["modified_missing_on_main"] + r["deleted_missing_on_main"])[:4]
        return "superseded", (
            f"touches {n} file(s) that no longer exist on main (e.g. {', '.join(ex)})"
        )
    if r["files_changed"] >= 3 and r["content_already_in_main_pct"] >= 90 and r["differing_count"] <= 1:
        return "superseded", (
            f"{r['content_already_in_main_pct']}% of touched files already identical to main "
            f"({r['same_count']}/{r['files_changed']})"
        )

    # ---- security-review (highest priority flag)
    sec = []
    tier = 2
    if r["branch_name_security"]:
        sec.append("security/audit/CVE wording in branch name")
        tier = 1
    if r["tip_is_security"]:
        sec.append("branch's own tip commit is a security fix")
        tier = 1
    if r["strong_sec_ratio"] >= 0.6 and not r["tip_is_security"]:
        sec.append(f"{r['strong_sec_ratio']:.0%} of the branch's own commits are security fixes")
        tier = 1
    if r["sec_sensitive_substantive"]:
        sec.append(
            f">={SEC_TOUCH_LINES} changed lines in security-sensitive path(s): "
            + ",".join(r["sec_sensitive_paths"])
        )
    if r["deps_only"] and not r["is_dependabot_generated"] and \
            r["insertions"] + r["deletions"] >= SEC_TOUCH_LINES:
        sec.append("dependency-only change to package.json/package-lock.json")
    if sec:
        return "security-review", "; ".join(sec) + f" [tier {tier}]"

    # ---- duplicate
    if r["is_duplicate"] and r["duplicate_of"] != r["branch"]:
        return "duplicate", (
            f"{r['duplicate_group_size']} branch(es) carry the same change; "
            f"canonical is {r['duplicate_of']} (group {r['duplicate_group_id']})"
        )

    # ---- candidate-salvage
    bits = []
    bits.append("applies cleanly onto today's main" if r["merge_clean"]
                else f"CONFLICTS with main in {r['merge_conflict_count']} file(s)")
    bits.append("main has not changed any file it modifies" if not r["main_diverged_modified_count"]
                else f"main has since changed {r['main_diverged_modified_count']} of the files it modifies")
    if r["added_count"] == r["files_changed"] and r["files_changed"]:
        bits.append(f"purely additive ({r['added_count']} new files, nothing deleted)")
    if r["missing_count"]:
        bits.append(f"adds {len(r['new_files_added'])} path(s) absent from main")
    bits.append(f"{r['insertions']}+/{r['deletions']}- across {r['files_changed']} file(s)")
    if r["days_stale"]:
        bits.append(f"{r['days_stale']}d since last commit")

    substantive = r["insertions"] >= 100 or (r["insertions"] >= 20 and r["files_changed"] >= 2)
    if r["merge_clean"] and substantive:
        grade = "A" if not r["main_diverged_modified_count"] else (
            "B" if r["main_diverged_modified_count"] <= 2 else "C"
        )
        return "candidate-salvage", f"[grade {grade}] " + "; ".join(bits)

    if r["insertions"] < 20 and r["files_changed"] <= 2:
        return "unclear", (
            f"trivial change ({r['insertions']}+/{r['deletions']}- in {r['files_changed']} file(s)) "
            f"- too small to judge; " + "; ".join(bits))
    return "unclear", (
        f"does not apply cleanly onto today's main ({r['merge_conflict_count']} conflict file(s)); "
        + "; ".join(bits))


# ------------------------------------------------------------------ output
CSV_COLS = [
    "branch", "category", "category_reason",
    "last_commit_date", "days_stale", "tip_sha", "commits_ahead", "commits_behind",
    "own_commits_not_in_main", "merge_base_date",
    "files_changed", "insertions", "deletions", "files_added", "files_modified",
    "files_deleted", "binary_files", "primary_top_dir", "all_top_dirs",
    "all_files_exist_on_main", "missing_on_main_count", "missing_on_main_files",
    "files_same_content_as_main", "content_already_in_main_pct", "content_fully_in_main",
    "main_diverged_modified_count", "main_diverged_modified_files",
    "merge_clean", "merge_conflict_count", "merge_conflicts",
    "touches_security_files", "touches_core_security_path", "security_paths_touched",
    "security_sensitive_lines", "touches_package_json", "touches_lockfile",
    "touches_next_config", "touches_env", "touches_auth", "touches_middleware",
    "touches_dockerfile", "touches_ci_workflow",
    "security_intent", "strong_security_subject", "strong_security_commit_ratio",
    "tip_commit_is_security", "security_commit_samples",
    "is_dependabot_generated", "dependabot_branch",
    "is_duplicate", "duplicate_group_id", "duplicate_group_size", "duplicate_of",
    "is_canonical_for_group",
    "open_pr", "pr_number", "pr_url", "pr_state", "pr_draft", "pr_mergeable",
    "pr_merge_state", "pr_created_at", "pr_base", "ever_had_pr", "closed_or_merged_pr_count",
    "commit_subjects", "own_commit_subjects", "numstat_raw",
]


def row_for(r):
    p0 = r["p0"]
    pf = r["path_flags"]
    return {
        "branch": r["branch"],
        "category": r["category"],
        "category_reason": r["category_reason"],
        "last_commit_date": r["last_commit_date"],
        "days_stale": r["days_stale"],
        "tip_sha": r["tip_sha"],
        "commits_ahead": r["commits_ahead"],
        "commits_behind": r["commits_behind"],
        "own_commits_not_in_main": r["own_commit_count"],
        "merge_base_date": r["merge_base_date"],
        "files_changed": r["files_changed"],
        "insertions": r["insertions"],
        "deletions": r["deletions"],
        "files_added": r["added_count"],
        "files_modified": r["modified_count"],
        "files_deleted": r["deleted_count"],
        "binary_files": r["binary_files"],
        "primary_top_dir": r["primary_top_dir"],
        "all_top_dirs": ";".join(r["top_dirs_list"]),
        "all_files_exist_on_main": r["all_files_exist_on_main"],
        "missing_on_main_count": r["missing_count"],
        "missing_on_main_files": ";".join(r["files_missing_on_main"][:60]),
        "files_same_content_as_main": r["same_count"],
        "content_already_in_main_pct": r["content_already_in_main_pct"],
        "content_fully_in_main": r["content_fully_in_main"],
        "main_diverged_modified_count": r["main_diverged_modified_count"],
        "main_diverged_modified_files": ";".join(r["main_diverged_modified"][:60]),
        "merge_clean": r["merge_clean"],
        "merge_conflict_count": r["merge_conflict_count"],
        "merge_conflicts": ";".join(r["merge_conflicts"][:20]),
        "touches_security_files": r["touches_security_files"],
        "touches_core_security_path": r["touches_core_security_path"],
        "security_paths_touched": ";".join(sorted(k for k, v in pf.items() if v)),
        "security_sensitive_lines": r["sec_sensitive_lines"],
        "touches_package_json": "package_json" in pf,
        "touches_lockfile": "lockfile" in pf,
        "touches_next_config": "next_config" in pf,
        "touches_env": "env" in pf,
        "touches_auth": "auth" in pf,
        "touches_middleware": "middleware" in pf,
        "touches_dockerfile": "dockerfile" in pf,
        "touches_ci_workflow": "ci_workflow" in pf,
        "security_intent": r["security_intent"],
        "strong_security_subject": r["strong_security_subject"],
        "strong_security_commit_ratio": r["strong_sec_ratio"],
        "tip_commit_is_security": r["tip_is_security"],
        "security_commit_samples": " | ".join(r["security_subject_samples"]),
        "is_dependabot_generated": r["is_dependabot_generated"],
        "dependabot_branch": r["dependabot_branch"],
        "is_duplicate": r["is_duplicate"],
        "duplicate_group_id": r["duplicate_group_id"],
        "duplicate_group_size": r["duplicate_group_size"],
        "duplicate_of": r["duplicate_of"],
        "is_canonical_for_group": r["is_canonical_for_group"],
        "open_pr": bool(r["prs_open"]),
        "pr_number": p0["number"] if p0 else "",
        "pr_url": p0["url"] if p0 else "",
        "pr_state": p0["state"] if p0 else "NONE",
        "pr_draft": p0["isDraft"] if p0 else "",
        "pr_mergeable": p0["mergeable"] if p0 else "N/A",
        "pr_merge_state": p0["mergeStateStatus"] if p0 else "N/A",
        "pr_created_at": p0["createdAt"] if p0 else "",
        "pr_base": p0["baseRefName"] if p0 else "",
        "ever_had_pr": bool(r["prs_all"]),
        "closed_or_merged_pr_count": sum(
            1 for p in r["prs_all"] if p["state"] in ("CLOSED", "MERGED")),
        "commit_subjects": " | ".join(r["subjects"]),
        "own_commit_subjects": " | ".join(r["own_subjects"]),
        "numstat_raw": r["numstat_raw"],
    }


JSON_DROP = {
    "files_missing_on_main", "files_same_content_as_main", "files_differing_from_main",
    "added", "modified", "deleted", "renamed", "deleted_missing_on_main",
    "modified_missing_on_main", "new_files_added", "main_diverged_modified",
    "merge_conflicts", "subject_set", "content_set", "own_subject_set", "paths",
    "content_fp", "prs_all", "prs_open", "p0", "strong_sec_commits",
    "security_subject_samples", "own_subjects_used", "path_flags", "numstat_raw",
    "top_dirs",
}


def main():
    recs = json.load(open(RAW))
    prs = json.load(open(PRS))
    apply_flags(recs, prs)
    dup_meta = find_duplicates(recs)
    for r in recs:
        r["category"], r["category_reason"] = classify(r)
    recs.sort(key=lambda r: (r["category"], -r["insertions"], r["branch"]))
    for m in dup_meta:
        m["canonical_category"] = next(
            (r["category"] for r in recs if r["branch"] == m["canonical_branch"]), "")

    with open(OUT_CSV, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=CSV_COLS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        for r in recs:
            w.writerow(row_for(r))

    js = []
    for r in recs:
        d = {k: v for k, v in r.items() if k not in JSON_DROP}
        d["files"] = r["files"]
        d["numstat_raw"] = r["numstat_raw"]
        d["commit_shas"] = r["commit_shas"]
        d["missing_on_main_files"] = r["files_missing_on_main"]
        d["main_diverged_modified_files"] = r["main_diverged_modified"]
        d["merge_conflicts"] = r["merge_conflicts"]
        d["own_commit_subjects"] = r["own_subjects"]
        d["security_paths_touched"] = sorted(k for k in r["path_flags"])
        d["security_commit_samples"] = r["strong_sec_commits"][:10]
        d["open_prs"] = [
            {k: p[k] for k in ("number", "url", "state", "mergeable",
                               "mergeStateStatus", "isDraft", "title")}
            for p in r["prs_open"]
        ]
        d["all_prs"] = [
            {k: p[k] for k in ("number", "url", "state", "mergeable",
                               "mergeStateStatus", "isDraft", "title")}
            for p in r["prs_all"]
        ]
        d["top_dirs_detail"] = r["top_dirs"]
        js.append(d)
    json.dump(js, open(OUT_JSON, "w"), indent=1)
    json.dump(dup_meta, open(OUT_DUP, "w"), indent=1)
    print(f"wrote {OUT_CSV}, {OUT_JSON}, {OUT_DUP}", file=sys.stderr)
    report(recs, dup_meta, prs)


def report(recs, dup_meta, prs):
    c = Counter(r["category"] for r in recs)
    print("\n=== CATEGORY COUNTS ===")
    for k in ["empty-no-diff", "superseded", "duplicate", "security-review",
              "candidate-salvage", "unclear"]:
        print(f"  {k:20s} {c.get(k,0):4d}")
    print(f"  {'TOTAL':20s} {len(recs):4d}")
    print(f"\nduplicate groups: {len(dup_meta)}  "
          f"branches in a group: {sum(1 for r in recs if r['is_duplicate'])}")
    print(f"branches with an OPEN PR: {sum(1 for r in recs if r['prs_open'])}")
    print(f"branches with a MERGED/CLOSED PR: "
          f"{sum(1 for r in recs if any(p['state'] in ('MERGED','CLOSED') for p in r['prs_all']))}")
    print(f"dependabot-generated: {sum(1 for r in recs if r['is_dependabot_generated'])}")
    print(f"security-file flag (broad): {sum(1 for r in recs if r['touches_security_files'])}")
    print(f"merge-clean: {sum(1 for r in recs if r['merge_clean'])}")


if __name__ == "__main__":
    main()
