#!/usr/bin/env python3
"""Read-only inventory collector for unmerged remote branches of headlesswp."""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor


WORKDIR = os.environ.get("BWINV_WORKDIR", "/tmp/bwinv")
def _repo_root():
    p = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                       capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit("run this from inside a clone of the repo, or set BWINV_REPO=/path/to/repo")
    return p.stdout.strip()


REPO = os.environ.get("BWINV_REPO") or _repo_root()
MAIN = "origin/main"
BRANCH_FILE = WORKDIR + "/all_remote.txt"
OUT = WORKDIR + "/raw.json"


def git(*args, check=True):
    p = subprocess.run(
        ["git", "-C", REPO, *args], capture_output=True, text=True, errors="replace"
    )
    if check and p.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {p.stderr[:300]}")
    return p.stdout


def parse_tree(text):
    tree = {}
    for line in text.splitlines():
        meta, path = line.split("\t", 1)
        mode, typ, sha = meta.split()
        tree[path] = (mode, typ, sha)
    return tree


def main_tree():
    return parse_tree(git("ls-tree", "-r", MAIN))


def collect(name, mtree):
    ref = f"origin/{name}"
    rec = {"branch": name}
    try:
        rec["tip_sha"] = git("rev-parse", ref).strip()
        rec["last_commit_date"] = git("log", "-1", "--format=%cI", ref).strip()
        rec["last_commit_date_short"] = git("log", "-1", "--format=%cs", ref).strip()
        rec["tip_subject"] = git("log", "-1", "--format=%s", ref).strip()
        rec["commits_ahead"] = int(git("rev-list", "--count", f"{MAIN}..{ref}").strip() or 0)
        rec["commits_behind"] = int(git("rev-list", "--count", f"{ref}..{MAIN}").strip() or 0)
        rec["merge_base"] = git("merge-base", MAIN, ref).strip()
        mb_date = git("log", "-1", "--format=%cs", rec["merge_base"]).strip()
        rec["merge_base_date"] = mb_date
        subjects = [
            s for s in git("log", "--format=%s", f"{MAIN}..{ref}").splitlines() if s.strip()
        ]
        rec["subjects"] = subjects
        rec["commit_shas"] = [
            s.strip() for s in git("log", "--format=%H", f"{MAIN}..{ref}").splitlines() if s.strip()
        ]
        # ONLY the commits that are genuinely unique to this branch (not already
        # in main, by patch-id). Shared base commits must not drive classification.
        rec["own_subjects"] = [
            s
            for s in git("log", "--cherry-pick", "--right-only", "--no-merges",
                         "--format=%s", f"{MAIN}...{ref}").splitlines()
            if s.strip()
        ]
        rec["own_commit_count"] = len(rec["own_subjects"])

        ns = git("diff", "--numstat", f"{MAIN}...{ref}", check=False)
        files, ins, dele, binary = [], 0, 0, 0
        for line in ns.splitlines():
            parts = line.split("\t")
            if len(parts) != 3:
                continue
            a, d, path = parts
            if a == "-" or d == "-":
                binary += 1
                a = d = "0"
            ins += int(a)
            dele += int(d)
            files.append({"path": path, "ins": int(a), "del": int(d)})
        rec["files"] = files
        rec["files_changed"] = len(files)
        rec["insertions"] = ins
        rec["deletions"] = dele
        rec["binary_files"] = binary
        rec["numstat_raw"] = ns

        # per-file change status (A/M/D) so additions can be told from deletions
        nst = git("diff", "--name-status", "-M", f"{MAIN}...{ref}", check=False)
        status = {}
        for line in nst.splitlines():
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            st, path = parts[0], parts[-1]
            status[path] = st
        for f in files:
            f["status"] = status.get(f["path"], "M")
        rec["added"] = sorted(p for p, s in status.items() if s.startswith("A"))
        rec["modified"] = sorted(p for p, s in status.items() if s.startswith("M"))
        rec["deleted"] = sorted(p for p, s in status.items() if s.startswith("D"))
        rec["renamed"] = sorted(p for p, s in status.items() if s.startswith("R"))
        rec["added_count"] = len(rec["added"])
        rec["modified_count"] = len(rec["modified"])
        rec["deleted_count"] = len(rec["deleted"])
        # how many files it DELETES that no longer exist on main
        rec["deleted_missing_on_main"] = sorted(
            p for p in rec["deleted"] if p not in mtree
        )
        rec["modified_missing_on_main"] = sorted(
            p for p in rec["modified"] if p not in mtree
        )
        rec["new_files_added"] = sorted(p for p in rec["added"] if p not in mtree)

        # ---- file existence on main / content already present ----
        btree = parse_tree(git("ls-tree", "-r", ref, check=False))
        missing, same, differing = [], [], []
        for f in files:
            p = f["path"]
            if p not in mtree:
                missing.append(p)
                continue
            b = btree.get(p)
            if b is None:  # branch deleted the file
                differing.append(p)
            elif b[2] == mtree[p][2]:
                same.append(p)
            else:
                differing.append(p)
        rec["files_missing_on_main"] = missing
        rec["files_same_content_as_main"] = same
        rec["files_differing_from_main"] = differing
        rec["all_files_exist_on_main"] = len(missing) == 0
        rec["missing_count"] = len(missing)
        rec["same_count"] = len(same)
        rec["differing_count"] = len(differing)
        rec["content_fully_in_main"] = bool(files) and len(differing) == 0
        rec["content_already_in_main_pct"] = (
            round(100.0 * len(same) / len(files), 1) if files else 0.0
        )

        # top-level dirs touched
        tops = {}
        for f in files:
            top = f["path"].split("/", 1)[0]
            tops.setdefault(top, {"files": 0, "ins": 0, "del": 0})
            tops[top]["files"] += 1
            tops[top]["ins"] += f["ins"]
            tops[top]["del"] += f["del"]
        rec["top_dirs"] = tops
        rec["top_dirs_list"] = sorted(tops, key=lambda t: -tops[t]["files"])

        # content fingerprint: net content of every touched path at the branch tip
        rec["content_fp"] = "\n".join(
            sorted(f"{f['path']}\0{btree.get(f['path'], ('x', 'x', 'DELETED'))[2]}" for f in files)
        )

        # how far main has moved on the files this branch modifies
        mbtree = parse_tree(git("ls-tree", "-r", rec["merge_base"], check=False))
        diverged = []
        for p in rec["modified"]:
            mb = mbtree.get(p)
            cur = mtree.get(p)
            if mb and cur and mb[2] != cur[2]:
                diverged.append(p)
        rec["main_diverged_modified_count"] = len(diverged)
        rec["main_diverged_modified"] = diverged

        # read-only 3-way merge dry run: does the branch still apply onto today's main?
        mt = subprocess.run(
            ["git", "-C", REPO, "merge-tree", "--write-tree", "--name-only", MAIN, ref],
            capture_output=True, text=True, errors="replace",
        )
        rec["merge_clean"] = mt.returncode == 0
        if mt.returncode == 0:
            rec["merge_conflict_count"] = 0
            rec["merge_conflicts"] = []
        else:
            lines = [l for l in (mt.stdout + "\n" + mt.stderr).splitlines() if l.strip()]
            conf = [l for l in lines if "\t" in l or l.startswith("CONFLICT")]
            rec["merge_conflict_count"] = len(conf)
            rec["merge_conflicts"] = conf[:20]
        rec["ok"] = True
    except Exception as e:  # noqa: BLE001
        rec["ok"] = False
        rec["error"] = str(e)
    return rec


def main():
    branches = [b.strip() for b in open(BRANCH_FILE) if b.strip()]
    mtree = main_tree()
    print(f"main tree: {len(mtree)} paths; collecting {len(branches)} branches", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=8) as ex:
        recs = list(ex.map(lambda b: collect(b, mtree), branches))
    json.dump(recs, open(OUT, "w"), indent=1)
    ok = sum(1 for r in recs if r.get("ok"))
    print(f"wrote {OUT}: {ok}/{len(recs)} ok", file=sys.stderr)
    for r in recs:
        if not r.get("ok"):
            print("FAIL", r["branch"], r.get("error"), file=sys.stderr)


if __name__ == "__main__":
    main()
