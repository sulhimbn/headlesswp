# Duplicate groups

**38 groups** covering **91 branches**. 53 of those branches are redundant copies of a change that survives on their canonical branch.

## How a duplicate was detected

Branches were linked into groups by any of:

1. **Identical tip commit** - the branches point at the same SHA. Nothing to choose; they are the same branch.
2. **Identical content fingerprint** - for every path the branch touches, the blob SHA at the branch tip is the same. The two branches produce byte-identical results, whatever their commit histories look like. This is the strong signal.
3. **Near-duplicate after name normalisation** - branch names are lower-cased, repeated `fix-`/`feature-`/`issue-NNN-` prefixes are stripped, and issue numbers are removed, then the two branches must have Jaccard >= 0.5 on commit-subject sets or on touched-file sets. This is what collapses `fix/build-001`, `fix/FIX-BUILD-001`, `fix/fix-build-001`, `fix/build-001-typescript-eslint` and friends into one group.

## Which branch was chosen as canonical

Newest last-commit date first; ties broken by an all-lowercase name, then the shorter name, then alphabetically. Newest wins because it is the most recent attempt at the same work. **This is a tie-break, not a quality judgement - if a human knows a different branch is the better record, override it.**

Groups are listed largest first. `open PRs` lists the PR numbers on any branch in the group; if any is open, none of the group should be deleted before that PR is resolved.

## DUP-001 - 8 branches

**Canonical: `fix/build-001-typescript-eslint`** (5 insertions, 1 files, last commit 2026-05-18, category `unclear`)

Matched on: identical content fingerprint (same net change); near-identical after name normalisation (subjectJ=0.00, contentJ=0.50); near-identical after name normalisation (subjectJ=0.00, contentJ=1.00); near-identical after name normalisation (subjectJ=1.00, contentJ=1.00). Open PRs on this group: [1400, 1412, 1446, 1448, 1450, 1452, 1458].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix-build-001` | 3 | 1 | 2026-05-16 | duplicate | 1448 |
| `fix/FIX-001-typescript-eslint-errors` | 3 | 1 | 2026-05-12 | duplicate | 1400 |
| `fix/FIX-BUILD-001-typescript-eslint-errors` | 3 | 1 | 2026-05-16 | duplicate | 1446 |
| `fix/build-001-typescript-eslint` | 5 | 1 | 2026-05-18 | unclear | 1458 |
| `fix/fix-build-001` | 114 | 2 | 2026-05-17 | duplicate | 1452 |
| `fix/issue-1449-typescript-eslint-errors` | 3 | 1 | 2026-05-17 | duplicate | 1450 |
| `fix/lint-type-errors` | 3 | 1 | 2026-05-11 | duplicate | - |
| `fix/typescript-eslint-errors` | 5 | 1 | 2026-05-13 | duplicate | 1412 |

## DUP-002 - 4 branches

**Canonical: `security/add-csp-header-rebased`** (4 insertions, 1 files, last commit 2026-02-26, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit; near-identical after name normalisation (subjectJ=1.00, contentJ=1.00). Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `pr-542` | 4 | 1 | 2026-02-26 | security-review | - |
| `security/add-csp-header` | 4 | 1 | 2026-02-26 | security-review | - |
| `security/add-csp-header-rebased` | 4 | 1 | 2026-02-26 | security-review | - |
| `security/add-csp-header-v2` | 4 | 1 | 2026-02-26 | security-review | - |

## DUP-003 - 3 branches

**Canonical: `feature/dx-001-dependency-update-workflow`** (576 insertions, 10 files, last commit 2026-05-09, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `arch-001-interface-compliance` | 576 | 10 | 2026-05-09 | duplicate | - |
| `feature/dx-001-dependency-update-workflow` | 576 | 10 | 2026-05-09 | unclear | - |
| `feature/ux-001-darkmode-toggle` | 576 | 10 | 2026-05-09 | duplicate | - |

## DUP-004 - 3 branches

**Canonical: `fix/security-txt-endpoint-1369`** (597 insertions, 7 files, last commit 2026-05-10, category `superseded`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feat/json-feed-1368` | 597 | 7 | 2026-05-10 | superseded | - |
| `feat/json-feed-support-1368` | 597 | 7 | 2026-05-10 | superseded | - |
| `fix/security-txt-endpoint-1369` | 597 | 7 | 2026-05-10 | superseded | - |

## DUP-005 - 3 branches

**Canonical: `fix/issue-1414-axios-security-vulnerabilities`** (132 insertions, 2 files, last commit 2026-05-15, category `security-review`)

Matched on: near-identical after name normalisation (subjectJ=0.00, contentJ=0.50); near-identical after name normalisation (subjectJ=0.00, contentJ=0.67). Open PRs on this group: [1416, 1426, 1437].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/SEC-003-axios-security-vulnerabilities` | 59 | 3 | 2026-05-14 | security-review | 1426 |
| `fix/axios-security-vulnerabilities` | 65 | 3 | 2026-05-14 | security-review | 1416 |
| `fix/issue-1414-axios-security-vulnerabilities` | 132 | 2 | 2026-05-15 | security-review | 1437 |

## DUP-006 - 3 branches

**Canonical: `fix/api-posts-error-response`** (86 insertions, 5 files, last commit 2026-03-08, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit; near-identical after name normalisation (subjectJ=0.11, contentJ=0.56). Open PRs on this group: [723, 755, 756].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/api-posts-error-response` | 86 | 5 | 2026-03-08 | unclear | 755 |
| `fix/api-posts-error-response-713` | 697 | 9 | 2026-03-07 | duplicate | 723 |
| `fix/merge-envValidation-dry-violation` | 86 | 5 | 2026-03-08 | duplicate | 756 |

## DUP-007 - 3 branches

**Canonical: `qa/add-socialshare-tests-717`** (710 insertions, 7 files, last commit 2026-03-08, category `candidate-salvage`)

Matched on: near-identical after name normalisation (subjectJ=0.00, contentJ=0.50). Open PRs on this group: [746, 751, 752].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/merge-envValidation-duplicate` | 74 | 5 | 2026-03-08 | duplicate | 746 |
| `fix/merge-envValidation-duplicate-715` | 710 | 7 | 2026-03-08 | duplicate | 751 |
| `qa/add-socialshare-tests-717` | 710 | 7 | 2026-03-08 | candidate-salvage | 752 |

## DUP-008 - 3 branches

**Canonical: `fix/npm-audit-vulnerabilities`** (53 insertions, 1 files, last commit 2026-03-20, category `security-review`)

Matched on: near-identical after name normalisation (subjectJ=0.00, contentJ=1.00). Open PRs on this group: [720, 738, 753].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/npm-audit-vulnerabilities` | 53 | 1 | 2026-03-20 | security-review | 753 |
| `fix/npm-audit-vulnerabilities-714` | 9 | 1 | 2026-03-08 | security-review | 738 |
| `fix/security-npm-audit-vulnerabilities-714` | 9 | 1 | 2026-03-06 | security-review | 720 |

## DUP-009 - 3 branches

**Canonical: `fix/nvmrc-version-alignment`** (8 insertions, 2 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/nvmrc-v2` | 8 | 2 | 2026-02-26 | duplicate | - |
| `fix/nvmrc-version-alignment` | 8 | 2 | 2026-02-26 | unclear | - |
| `pr-556` | 8 | 2 | 2026-02-26 | duplicate | - |

## DUP-010 - 2 branches

**Canonical: `docs/update-blueprint-v1.0.2`** (23 insertions, 2 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `docs/update-blueprint-v1.0.2` | 23 | 2 | 2026-02-26 | unclear | - |
| `pr-559` | 23 | 2 | 2026-02-26 | duplicate | - |

## DUP-011 - 2 branches

**Canonical: `dx/api-contract-testing`** (1122 insertions, 4 files, last commit 2026-03-18, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [815, 816].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `dx/api-contract-testing` | 1122 | 4 | 2026-03-18 | candidate-salvage | 815 |
| `dx/useDarkMode-coverage-v2` | 1122 | 4 | 2026-03-18 | duplicate | 816 |

## DUP-012 - 2 branches

**Canonical: `dx/sentry-integration`** (3052 insertions, 12 files, last commit 2026-02-26, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `dx/sentry-integration` | 3052 | 12 | 2026-02-26 | security-review | - |
| `pr-544` | 3052 | 12 | 2026-02-26 | security-review | - |

## DUP-013 - 2 branches

**Canonical: `feat/add-precommit-hooks-1173`** (1010 insertions, 15 files, last commit 2026-04-24, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit; near-identical after name normalisation (subjectJ=1.00, contentJ=1.00). Open PRs on this group: [1181, 1206].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feat/add-precommit-hooks` | 1010 | 15 | 2026-04-24 | duplicate | 1206 |
| `feat/add-precommit-hooks-1173` | 1010 | 15 | 2026-04-24 | candidate-salvage | 1181 |

## DUP-014 - 2 branches

**Canonical: `feat/add-redis-cache-adapter`** (3320 insertions, 39 files, last commit 2026-03-31, category `security-review`)

Matched on: identical content fingerprint (same net change). Open PRs on this group: [897, 924].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feat/add-redis-cache-adapter` | 3320 | 39 | 2026-03-31 | security-review | 897 |
| `fix/redis-cache-adapter-856` | 3320 | 39 | 2026-03-31 | security-review | 924 |

## DUP-015 - 2 branches

**Canonical: `feat/page-view-analytics-859`** (641 insertions, 12 files, last commit 2026-03-28, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [903, 923].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feat/page-view-analytics-859` | 641 | 12 | 2026-03-28 | candidate-salvage | 903 |
| `feature/keyboard-shortcuts` | 641 | 12 | 2026-03-28 | duplicate | 923 |

## DUP-016 - 2 branches

**Canonical: `feature/add-dependabot-workflow-dx-001`** (54 insertions, 2 files, last commit 2026-05-10, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [1361, 1363].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/add-dependabot-workflow-dx-001` | 54 | 2 | 2026-05-10 | candidate-salvage | 1361 |
| `test/TEST-001-social-share-component-tests` | 54 | 2 | 2026-05-10 | duplicate | 1363 |

## DUP-017 - 2 branches

**Canonical: `fix/middleware-edge-routing-787`** (1269 insertions, 12 files, last commit 2026-03-19, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [827, 828].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/api-contract-testing` | 1269 | 12 | 2026-03-19 | security-review | 827 |
| `fix/middleware-edge-routing-787` | 1269 | 12 | 2026-03-19 | security-review | 828 |

## DUP-018 - 2 branches

**Canonical: `fix/serialize-javascript-vulnerability`** (1548 insertions, 16 files, last commit 2026-03-04, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [685, 698].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/dx-innovation-features` | 1548 | 16 | 2026-03-04 | duplicate | 698 |
| `fix/serialize-javascript-vulnerability` | 1548 | 16 | 2026-03-04 | security-review | 685 |

## DUP-019 - 2 branches

**Canonical: `feature/predictive-prefetch-788`** (3629 insertions, 31 files, last commit 2026-03-19, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [832, 833].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/e2e-tests-780` | 3629 | 31 | 2026-03-19 | security-review | 832 |
| `feature/predictive-prefetch-788` | 3629 | 31 | 2026-03-19 | security-review | 833 |

## DUP-020 - 2 branches

**Canonical: `feature/og-image-generation-684-v3`** (357 insertions, 18 files, last commit 2026-04-01, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [934].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/og-image-generation-684-v3` | 357 | 18 | 2026-04-01 | unclear | 934 |
| `fix/strict-null-checks-929` | 357 | 18 | 2026-04-01 | duplicate | - |

## DUP-021 - 2 branches

**Canonical: `fix/author-profile-navigation-1395`** (2122 insertions, 24 files, last commit 2026-05-14, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [1424, 1425].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `feature/otel-tracing-1371` | 2122 | 24 | 2026-05-14 | security-review | 1425 |
| `fix/author-profile-navigation-1395` | 2122 | 24 | 2026-05-14 | security-review | 1424 |

## DUP-022 - 2 branches

**Canonical: `fix/ServiceStatus-tooltip-test`** (9 insertions, 2 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/ServiceStatus-tooltip-test` | 9 | 2 | 2026-02-26 | unclear | - |
| `pr-555` | 9 | 2 | 2026-02-26 | duplicate | - |

## DUP-023 - 2 branches

**Canonical: `fix/cache-warmer-hardcoded-keys`** (11 insertions, 2 files, last commit 2026-03-08, category `unclear`)

Matched on: identical content fingerprint (same net change). Open PRs on this group: [745, 754].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/cache-warmer-hardcoded-keys` | 11 | 2 | 2026-03-08 | unclear | 754 |
| `fix/cacheWarmer-hardcoded-keys` | 11 | 2 | 2026-03-08 | duplicate | 745 |

## DUP-024 - 2 branches

**Canonical: `fix/csp-header-786`** (277 insertions, 4 files, last commit 2026-03-13, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [790, 791].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/csp-header-786` | 277 | 4 | 2026-03-13 | security-review | 790 |
| `fix/middleware-787` | 277 | 4 | 2026-03-13 | security-review | 791 |

## DUP-025 - 2 branches

**Canonical: `fix/docker-image-versions`** (2 insertions, 1 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/docker-image-versions` | 2 | 1 | 2026-02-26 | unclear | - |
| `pr-572` | 2 | 1 | 2026-02-26 | duplicate | - |

## DUP-026 - 2 branches

**Canonical: `fix/dockerfile-node-version-alignment`** (3 insertions, 1 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change). Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/dockerfile-node-version-alignment` | 3 | 1 | 2026-02-26 | unclear | - |
| `fix/nodejs-version-alignment` | 3 | 1 | 2026-02-26 | duplicate | - |

## DUP-027 - 2 branches

**Canonical: `fix/issue-646-pwa-missing-icons`** (6 insertions, 6 files, last commit 2026-02-27, category `unclear`)

Matched on: near-identical after name normalisation (subjectJ=0.00, contentJ=0.83). Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/issue-646-pwa-missing-icons` | 6 | 6 | 2026-02-27 | unclear | - |
| `fix/pwa-missing-icons` | 0 | 5 | 2026-02-27 | duplicate | - |

## DUP-028 - 2 branches

**Canonical: `fix/issue-705-bundle-analyzer`** (171 insertions, 4 files, last commit 2026-03-05, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [706, 707].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/issue-683-a11y` | 171 | 4 | 2026-03-05 | duplicate | 706 |
| `fix/issue-705-bundle-analyzer` | 171 | 4 | 2026-03-05 | candidate-salvage | 707 |

## DUP-029 - 2 branches

**Canonical: `fix/issue-703-bundle-size-monitoring-v2`** (183 insertions, 4 files, last commit 2026-03-05, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit; near-identical after name normalisation (subjectJ=1.00, contentJ=1.00). Open PRs on this group: [710].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/issue-703-bundle-size-monitoring` | 183 | 4 | 2026-03-05 | duplicate | - |
| `fix/issue-703-bundle-size-monitoring-v2` | 183 | 4 | 2026-03-05 | unclear | 710 |

## DUP-030 - 2 branches

**Canonical: `fix/logger-warn-signature-telemetry`** (3 insertions, 2 files, last commit 2026-02-26, category `unclear`)

Matched on: identical content fingerprint (same net change). Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/logger-warn-signature-telemetry` | 3 | 2 | 2026-02-26 | unclear | - |
| `pr-566` | 3 | 2 | 2026-02-26 | duplicate | - |

## DUP-031 - 2 branches

**Canonical: `fix/middleware-consolidation-v2`** (66 insertions, 6 files, last commit 2026-05-06, category `security-review`)

Matched on: near-identical after name normalisation (subjectJ=0.00, contentJ=0.67). Open PRs on this group: [953].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/middleware-consolidation` | 93 | 4 | 2026-04-03 | security-review | 953 |
| `fix/middleware-consolidation-v2` | 66 | 6 | 2026-05-06 | security-review | - |

## DUP-032 - 2 branches

**Canonical: `fix/sec-001-npm-audit-vulnerabilities`** (519 insertions, 6 files, last commit 2026-05-08, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: none.

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/sec-001-npm-audit-vulnerabilities` | 519 | 6 | 2026-05-08 | security-review | - |
| `pr/TEST-002` | 519 | 6 | 2026-05-08 | duplicate | - |

## DUP-033 - 2 branches

**Canonical: `fix/security-vulnerabilities`** (68 insertions, 2 files, last commit 2026-05-14, category `security-review`)

Matched on: identical content fingerprint (same net change). Open PRs on this group: [744, 1428].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `fix/security-vulnerabilities` | 68 | 2 | 2026-05-14 | security-review | 744 |
| `fix/security-vulns-2026` | 68 | 2 | 2026-05-14 | security-review | 1428 |

## DUP-034 - 2 branches

**Canonical: `innovation-media-prefetch-og`** (1642 insertions, 14 files, last commit 2026-03-11, category `candidate-salvage`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [779].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `innovation-media-prefetch-og` | 1642 | 14 | 2026-03-11 | candidate-salvage | - |
| `qa-add-tests` | 1642 | 14 | 2026-03-11 | duplicate | 779 |

## DUP-035 - 2 branches

**Canonical: `pr/middleware-edge-optimization`** (1539 insertions, 13 files, last commit 2026-03-19, category `security-review`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [830, 831].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `pr/middleware-edge-optimization` | 1539 | 13 | 2026-03-19 | security-review | 830 |
| `test/coverage-increase-792` | 1539 | 13 | 2026-03-19 | security-review | 831 |

## DUP-036 - 2 branches

**Canonical: `test/table-of-contents-tests`** (716 insertions, 2 files, last commit 2026-03-07, category `superseded`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [734, 735].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `test/error-boundary-tests` | 716 | 2 | 2026-03-07 | superseded | 734 |
| `test/table-of-contents-tests` | 716 | 2 | 2026-03-07 | superseded | 735 |

## DUP-037 - 2 branches

**Canonical: `test/qa-add-tests-summary-media-api-routes-759`** (903 insertions, 3 files, last commit 2026-03-09, category `superseded`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [740, 768].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `test/qa-add-tests-summary-media-api-routes-759` | 903 | 3 | 2026-03-09 | superseded | 768 |
| `test/useDarkMode-hook-coverage-731` | 903 | 3 | 2026-03-09 | superseded | 740 |

## DUP-038 - 2 branches

**Canonical: `test/table-of-contents-component-729`** (821 insertions, 5 files, last commit 2026-03-07, category `unclear`)

Matched on: identical content fingerprint (same net change); identical tip commit. Open PRs on this group: [739, 741].

| Branch | ins | files | last commit | category | open PR |
|---|---:|---:|---|---|---|
| `test/reading-progress-component-718` | 821 | 5 | 2026-03-07 | duplicate | 741 |
| `test/table-of-contents-component-729` | 821 | 5 | 2026-03-07 | unclear | 739 |

