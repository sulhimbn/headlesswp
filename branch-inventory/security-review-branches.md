# `security-review` branches

**178 of 425 branches** are classified `security-review`. 149 of them have an open PR, 29 do not.

## What triggered the flag

- **Tier 1 - explicit security intent (102 branches).** The branch name says `security`/`audit`/`CVE`/`sec-NNN`, or the branch's own tip commit is a security fix, or 60%+ of the branch's own commits are security fixes. *These are the real security work.* Note that the *own* commit list comes from `git log --cherry-pick --right-only`, so shared base commits that main already has are excluded from the test.
- **Tier 2 - security-sensitive file touched (76 branches).** No security wording, but the branch substantively edits a security-sensitive path (>=20 changed lines, test files excluded from the count): `src/middleware.ts`, `.env*`, `Dockerfile*`, `docker-compose*`, security CI workflows, Sentry config, `next.config.js`, or is a dependency-only change to `package.json`/`package-lock.json`. *This bucket is mostly the middleware argument.*

The broad flag `touches_security_files` (the task's literal list, including any touch of `package.json`, `package-lock.json`, `next.config.js`, `middleware`, `auth`) is set on **288 of 425** branches and is a column in the CSV. The category above is narrower, on purpose: 288 is not a triage list, 178 split into two readable tiers is.

## Tier 1 - explicit security intent (102)

| branch | ins | files | last commit | open PR | duplicate of | deletion tier |
|---|---|---|---|---|---|---|
| fix/security-vulnerability-only | 9597 | 2 | 2026-03-02 | #668 CONFLICTING | - | 1 |
| fix/sec-010-qa-900 | 2060 | 4 | 2026-05-05 | #1300 MERGEABLE | - | 0 |
| fix/npm-audit-vulnerabilities-843 | 1898 | 10 | 2026-03-21 | #851 CONFLICTING | - | 1 |
| fix/security-vulnerabilities-2026-04-21 | 1590 | 18 | 2026-04-21 | #1154 MERGEABLE | - | 0 |
| fix/serialize-javascript-vulnerability | 1548 | 16 | 2026-03-04 | #685 CONFLICTING | (canonical) | 1 |
| chore/manager-audit-2026-04-22 | 1484 | 26 | 2026-04-22 | #1161 MERGEABLE | - | 0 |
| feature/middleware-security-tests | 1250 | 16 | 2026-04-24 | #1207 MERGEABLE | - | 0 |
| fix/resolve-issues-2026-04-09 | 1210 | 32 | 2026-04-09 | #1029 MERGEABLE | - | 0 |
| feat/system-audit-2026-05-09 | 1191 | 11 | 2026-05-09 | - | - | 7 |
| fix/security-tests-may2026 | 1165 | 8 | 2026-05-15 | #1429 MERGEABLE | - | 0 |
| fix/API-error-handling-2026 | 792 | 9 | 2026-04-20 | #1135 MERGEABLE | - | 0 |
| fix/843-npm-audit-vulnerabilities | 715 | 3 | 2026-03-21 | #848 CONFLICTING | - | 1 |
| fix/audit-cycle-2026-03-18 | 649 | 19 | 2026-03-18 | #820 CONFLICTING | - | 1 |
| fix/rate-limiting-security | 631 | 10 | 2026-04-26 | #1217 MERGEABLE | - | 0 |
| fix/axios-ssrf-cve-2025-27152 | 572 | 7 | 2026-04-24 | #1202 MERGEABLE | - | 0 |
| fix/remove-misleading-rate-limit-headers | 572 | 8 | 2026-04-24 | #1203 MERGEABLE | - | 0 |
| fix/issues-sec-front-dx-qa | 559 | 10 | 2026-04-13 | #1070 MERGEABLE | - | 0 |
| fix/sec-001-npm-audit-vulnerabilities | 519 | 6 | 2026-05-08 | - | (canonical) | 2 |
| security/fix-hardcoded-urls-and-deprecated-header | 491 | 15 | 2026-05-11 | #1390 MERGEABLE | - | 0 |
| fix/sec-013-hardcoded-urls | 477 | 9 | 2026-05-15 | #1441 MERGEABLE | - | 0 |
| feature/security-txt-endpoint | 466 | 11 | 2026-05-11 | #1379 CONFLICTING | - | 1 |
| fix/security-npm-vulnerabilities-2026-04 | 432 | 4 | 2026-04-30 | #1256 MERGEABLE | - | 0 |
| fix/handlebars-vulnerability-secure-2026 | 389 | 5 | 2026-05-14 | #1419 MERGEABLE | - | 0 |
| fix/build-error-security-issues | 377 | 9 | 2026-04-25 | #1210 MERGEABLE | - | 0 |
| fix/security-api-issues | 376 | 8 | 2026-04-20 | #1134 MERGEABLE | - | 0 |
| dx-improvements | 359 | 10 | 2026-04-21 | #1158 MERGEABLE | - | 0 |
| fix-issues-2026-04-11 | 322 | 12 | 2026-04-11 | #1054 MERGEABLE | - | 0 |
| fix/1313-duplicate-middleware-headers | 309 | 8 | 2026-05-10 | - | - | 7 |
| fix/security-and-build-issues | 300 | 8 | 2026-04-25 | #1209 MERGEABLE | - | 0 |
| fix/SEC-002-env-validation-required | 282 | 5 | 2026-04-07 | #1005 MERGEABLE | - | 0 |
| fix/build-and-security-fixes | 276 | 5 | 2026-05-19 | #1460 MERGEABLE | - | 0 |
| fix/883-picomatch-redos-vulnerability | 274 | 2 | 2026-03-27 | #892 MERGEABLE | - | 0 |
| fix/serialize-javascript-vuln-v2 | 259 | 3 | 2026-03-04 | #697 CONFLICTING | - | 1 |
| fix/api-error-handling-security | 250 | 10 | 2026-04-21 | #1137 MERGEABLE | - | 0 |
| fix/security-and-error-handling-issues | 248 | 9 | 2026-04-20 | #1136 MERGEABLE | - | 0 |
| fix/axios-ssrf-vulnerability | 206 | 9 | 2026-04-19 | #1125 MERGEABLE | - | 0 |
| fix/issue-1128-rate-limit-middleware | 200 | 14 | 2026-04-21 | #1140 MERGEABLE | - | 0 |
| fix/build-and-security-updates | 188 | 9 | 2026-05-12 | #1401 MERGEABLE | - | 0 |
| fix/security-ux-improvements | 187 | 9 | 2026-04-29 | #1247 MERGEABLE | - | 0 |
| fix/middleware-merge | 184 | 8 | 2026-04-30 | #1254 MERGEABLE | - | 0 |
| fix/nextjs-dos-vulnerability | 178 | 5 | 2026-04-28 | #1246 MERGEABLE | - | 0 |
| fix/sec-004-rate-limit-constants | 173 | 4 | 2026-05-10 | - | - | 7 |
| fix/consolidate-env-validation | 170 | 12 | 2026-04-09 | #1028 MERGEABLE | - | 0 |
| chore/security-updates-2026-03-20 | 156 | 3 | 2026-03-20 | #840 CONFLICTING | - | 1 |
| fix/SEC-004-handlebars-javascript-injection | 154 | 4 | 2026-05-14 | #1427 MERGEABLE | - | 0 |
| fix/security-patches-and-typescript-2026-05-13 | 147 | 3 | 2026-05-13 | #1418 MERGEABLE | - | 0 |
| fix/build-and-security | 142 | 3 | 2026-05-18 | #1459 MERGEABLE | - | 0 |
| fix/issue-1430-1431-typescript-eslint | 135 | 3 | 2026-05-15 | #1438 MERGEABLE | - | 0 |
| fix/SEC-005-FIX-BUILD-001 | 134 | 3 | 2026-05-18 | #1457 MERGEABLE | - | 0 |
| fix/security-updates-2026-05 | 133 | 2 | 2026-05-13 | #1417 MERGEABLE | - | 0 |
| fix/issue-1414-axios-security-vulnerabilities | 132 | 2 | 2026-05-15 | #1437 MERGEABLE | (canonical) | 0 |
| fix/security-issues-1013-1011-997 | 132 | 12 | 2026-04-08 | #1017 MERGEABLE | - | 0 |
| fix/security-updates-2026-04-13 | 132 | 10 | 2026-04-13 | #1069 MERGEABLE | - | 0 |
| fix/issue-1415-handlebars-cve | 128 | 2 | 2026-05-15 | - | - | 7 |
| fix/typescript-eslint-axios-upgrade | 126 | 3 | 2026-05-12 | #1406 MERGEABLE | - | 0 |
| fix/issue-1012-api-error-status-codes | 109 | 9 | 2026-04-08 | #1019 MERGEABLE | - | 0 |
| fix/security-vulnerabilities-714 | 107 | 3 | 2026-03-07 | #727 CONFLICTING | - | 1 |
| fix/1248-npm-audit-vulnerabilities | 103 | 1 | 2026-04-29 | #1249 MERGEABLE | - | 0 |
| fix/middleware-proxy-conflict-and-audit | 94 | 3 | 2026-03-29 | #914 MERGEABLE | - | 0 |
| audit-2026-04-28 | 92 | 1 | 2026-04-28 | #1245 MERGEABLE | - | 0 |
| fix/picomatch-redirect-860 | 87 | 5 | 2026-03-27 | #893 MERGEABLE | - | 0 |
| fix/build-errors-and-security | 83 | 8 | 2026-05-18 | #1456 MERGEABLE | - | 0 |
| fix/cve-security-patches-v2 | 78 | 8 | 2026-04-24 | #1200 MERGEABLE | - | 0 |
| fix/security-vulnerabilities-2025-05 | 77 | 5 | 2026-05-13 | #1413 MERGEABLE | - | 0 |
| fix/issues-712-715 | 73 | 6 | 2026-03-06 | #725 CONFLICTING | - | 1 |
| fix/security-vulnerabilities | 68 | 2 | 2026-05-14 | #744 MERGEABLE | (canonical) | 0 |
| fix/security-vulns-2026 | 68 | 2 | 2026-05-14 | #1428 MERGEABLE | fix/security-vulnerabilities | 0 |
| fix/axios-security-vulnerabilities | 65 | 3 | 2026-05-14 | #1416 MERGEABLE | fix/issue-1414-axios-security-vulnerabilities | 0 |
| security/add-security-headers | 65 | 2 | 2026-02-25 | - | - | 7 |
| fix/SEC-003-axios-security-vulnerabilities | 59 | 3 | 2026-05-14 | #1426 MERGEABLE | fix/issue-1414-axios-security-vulnerabilities | 0 |
| pr-570 | 59 | 2 | 2026-02-26 | - | - | 7 |
| fix/multiple-issues-2026-04-18 | 53 | 7 | 2026-04-18 | #1110 MERGEABLE | - | 0 |
| fix/npm-audit-vulnerabilities | 53 | 1 | 2026-03-20 | #753 CONFLICTING | (canonical) | 1 |
| fix/issues-1086-1089-1092-1093 | 52 | 6 | 2026-04-15 | #1094 MERGEABLE | - | 0 |
| system-audit-v1.0.4 | 51 | 1 | 2026-05-04 | #1290 MERGEABLE | - | 0 |
| fix/audit-issues | 49 | 5 | 2026-04-23 | #1183 MERGEABLE | - | 0 |
| pr-565 | 46 | 3 | 2026-02-26 | - | - | 7 |
| pr-562 | 41 | 3 | 2026-02-26 | - | - | 7 |
| fix/multiple-issues-2026 | 39 | 7 | 2026-04-09 | #1021 MERGEABLE | - | 0 |
| fix/1187-axios-cve-2025-27152 | 36 | 3 | 2026-04-24 | #1198 MERGEABLE | - | 0 |
| fix/api-routes-and-security-fixes | 35 | 8 | 2026-04-08 | #1020 MERGEABLE | - | 0 |
| security-fixes-2026 | 28 | 4 | 2026-04-19 | #1126 MERGEABLE | - | 0 |
| fix/sec-001-csp-middleware | 27 | 1 | 2026-05-07 | - | - | 7 |
| security/https-url-validation | 25 | 3 | 2026-02-25 | - | - | 7 |
| fix/883-picomatch-redos | 18 | 3 | 2026-03-26 | #885 MERGEABLE | - | 0 |
| fix/tag-page-optimization | 14 | 3 | 2026-04-25 | #1215 MERGEABLE | - | 0 |
| fix/npm-audit-vulnerabilities-714 | 9 | 1 | 2026-03-08 | #738 CONFLICTING | fix/npm-audit-vulnerabilities | 1 |
| fix/security-headers-tsconfig | 9 | 2 | 2026-03-24 | #874 MERGEABLE | - | 0 |
| fix/security-npm-audit-vulnerabilities-714 | 9 | 1 | 2026-03-06 | #720 CONFLICTING | fix/npm-audit-vulnerabilities | 1 |
| security-fix-vulnerability-patches-2026-04-19 | 9 | 3 | 2026-04-19 | #1127 MERGEABLE | - | 0 |
| fix/sec-002-missing-security-headers | 7 | 1 | 2026-05-09 | - | - | 7 |
| fix/xss-json-ld-injection | 7 | 1 | 2026-04-18 | #1119 MERGEABLE | - | 0 |
| fix/picomatch-redos-vuln-3 | 5 | 2 | 2026-03-26 | #887 MERGEABLE | - | 0 |
| fix/picomatch-redos-vulnerability | 5 | 2 | 2026-03-26 | #884 MERGEABLE | - | 0 |
| fix/deprecated-endpoint-and-rate-limit-headers | 4 | 4 | 2026-04-15 | #1085 MERGEABLE | - | 0 |
| fix/security-xss-poweredby-2026-04-18 | 4 | 2 | 2026-04-18 | #1121 MERGEABLE | - | 0 |
| pr-542 | 4 | 1 | 2026-02-26 | - | security/add-csp-header-rebased | 7 |
| security/add-csp-header | 4 | 1 | 2026-02-26 | - | security/add-csp-header-rebased | 7 |
| security/add-csp-header-rebased | 4 | 1 | 2026-02-26 | - | (canonical) | 2 |
| security/add-csp-header-v2 | 4 | 1 | 2026-02-26 | - | security/add-csp-header-rebased | 7 |
| fix/serialize-javascript-v2 | 3 | 1 | 2026-03-03 | #690 CONFLICTING | - | 1 |
| fix/issue-1356-hardcoded-rate-limit | 0 | 1 | 2026-05-10 | #1360 MERGEABLE | - | 0 |

## Tier 2 - security-sensitive files touched, no security intent (76)

| branch | ins | files | last commit | open PR | duplicate of | deletion tier |
|---|---|---|---|---|---|---|
| fix/issue-impl-v2 | 9720 | 77 | 2026-04-02 | #940 MERGEABLE | - | 0 |
| feature/cache-export-import | 6210 | 57 | 2026-03-30 | #915 MERGEABLE | - | 0 |
| feature/add-hreflang-tags-seo | 5651 | 53 | 2026-03-30 | #920 MERGEABLE | - | 0 |
| feature/storybook-setup | 4509 | 41 | 2026-03-30 | #918 MERGEABLE | - | 0 |
| fix/merge-feature-branches | 3939 | 43 | 2026-03-14 | #801 CONFLICTING | - | 1 |
| fix/merge-middleware-add-tests-smart-prefetch | 3649 | 19 | 2026-05-02 | #1269 MERGEABLE | - | 0 |
| feature/e2e-tests-780 | 3629 | 31 | 2026-03-19 | #832 CONFLICTING | feature/predictive-prefetch-788 | 1 |
| feature/predictive-prefetch-788 | 3629 | 31 | 2026-03-19 | #833 CONFLICTING | (canonical) | 1 |
| feat/add-redis-cache-adapter | 3320 | 39 | 2026-03-31 | #897 MERGEABLE | (canonical) | 0 |
| fix/redis-cache-adapter-856 | 3320 | 39 | 2026-03-31 | #924 MERGEABLE | feat/add-redis-cache-adapter | 0 |
| feat/system-orchestrator-v1.0.4 | 3114 | 16 | 2026-05-06 | #1303 MERGEABLE | - | 0 |
| dx/sentry-integration | 3052 | 12 | 2026-02-26 | - | (canonical) | 2 |
| pr-544 | 3052 | 12 | 2026-02-26 | - | dx/sentry-integration | 7 |
| pr-540 | 2878 | 9 | 2026-02-26 | - | - | 7 |
| feat/on-demand-isr-webhook-845 | 2757 | 13 | 2026-03-21 | #852 CONFLICTING | - | 1 |
| dx/readingHistory-coverage | 2506 | 10 | 2026-03-18 | #819 MERGEABLE | - | 0 |
| feature/predictive-prefetching | 2495 | 17 | 2026-03-15 | #804 CONFLICTING | - | 1 |
| feature/otel-tracing-1371 | 2122 | 24 | 2026-05-14 | #1425 MERGEABLE | fix/author-profile-navigation-1395 | 0 |
| fix/author-profile-navigation-1395 | 2122 | 24 | 2026-05-14 | #1424 MERGEABLE | (canonical) | 0 |
| dx/add-react-component-tests-80-to-85 | 1941 | 8 | 2026-03-19 | #822 CONFLICTING | - | 1 |
| test/react-component-tests-792 | 1933 | 18 | 2026-03-19 | #829 CONFLICTING | - | 1 |
| perf/middleware-edge | 1898 | 9 | 2026-03-18 | #818 MERGEABLE | - | 0 |
| fix/consolidate-envValidation-modules-1372 | 1705 | 11 | 2026-05-10 | - | - | 7 |
| feature/keyboard-shortcuts-og-images | 1630 | 15 | 2026-03-20 | #838 CONFLICTING | - | 1 |
| pr/middleware-edge-optimization | 1539 | 13 | 2026-03-19 | #830 CONFLICTING | (canonical) | 1 |
| test/coverage-increase-792 | 1539 | 13 | 2026-03-19 | #831 CONFLICTING | pr/middleware-edge-optimization | 1 |
| feature/middleware-edge-optimization | 1471 | 7 | 2026-03-15 | #803 CONFLICTING | - | 1 |
| chore/e2e-tests-playwright | 1437 | 19 | 2026-04-22 | - | - | 7 |
| feature/api-contract-testing | 1269 | 12 | 2026-03-19 | #827 CONFLICTING | fix/middleware-edge-routing-787 | 1 |
| fix/middleware-edge-routing-787 | 1269 | 12 | 2026-03-19 | #828 CONFLICTING | (canonical) | 1 |
| dx-api-contract-testing | 1201 | 6 | 2026-03-19 | #823 CONFLICTING | - | 1 |
| test/coverage-792-793 | 1191 | 7 | 2026-03-21 | #847 MERGEABLE | - | 0 |
| feat/add-playwright-e2e-tests | 1169 | 23 | 2026-03-27 | #896 MERGEABLE | - | 0 |
| feat/793-increase-useDarkMode-coverage | 1129 | 4 | 2026-03-21 | #849 CONFLICTING | - | 1 |
| fix/multiple-issues-apr-2026 | 1014 | 13 | 2026-04-22 | #1068 MERGEABLE | - | 0 |
| feat/sentry-error-tracking | 767 | 14 | 2026-03-27 | #895 MERGEABLE | - | 0 |
| fix/manager-cycle-2026-04-21 | 700 | 11 | 2026-04-21 | #1141 MERGEABLE | - | 0 |
| feature/keyboard-shortcuts-middleware-og-images | 687 | 8 | 2026-03-14 | #800 CONFLICTING | - | 1 |
| fix/FIX-BUILD-001-merge-middleware-into-proxy | 597 | 7 | 2026-05-17 | #1453 MERGEABLE | - | 0 |
| feature/component-tests-shortcuts-middleware | 543 | 8 | 2026-03-17 | #812 MERGEABLE | - | 0 |
| feat/api-middleware-pattern-standalone | 533 | 4 | 2026-05-07 | - | - | 7 |
| feature/json-feed | 524 | 13 | 2026-05-11 | - | - | 7 |
| fix/summarizer-coverage | 499 | 8 | 2026-05-07 | - | - | 7 |
| feat/cycle-2026-05-19 | 431 | 12 | 2026-05-19 | #1470 MERGEABLE | - | 0 |
| fix/middleware-merge-build-error | 286 | 5 | 2026-04-04 | #959 MERGEABLE | - | 0 |
| fix/csp-header-786 | 277 | 4 | 2026-03-13 | #790 CONFLICTING | (canonical) | 1 |
| fix/middleware-787 | 277 | 4 | 2026-03-13 | #791 CONFLICTING | fix/csp-header-786 | 1 |
| fix/merge-middleware-qa-updates | 260 | 5 | 2026-05-03 | #1279 MERGEABLE | - | 0 |
| fix/architectural-drift-dx-improvements | 231 | 14 | 2026-04-05 | #986 MERGEABLE | - | 0 |
| fix/middleware-proxy-merge | 224 | 9 | 2026-03-31 | #917 MERGEABLE | - | 0 |
| feat/skeleton-loading-1174 | 216 | 6 | 2026-04-23 | #1178 MERGEABLE | - | 0 |
| fix/resolve-issues-may-2026 | 200 | 11 | 2026-05-09 | - | - | 7 |
| fix/2026-04-01-system-orchestrator-cycle | 163 | 7 | 2026-04-01 | #932 MERGEABLE | - | 0 |
| fix/middleware-merge-for-nextjs16 | 144 | 5 | 2026-04-29 | #1252 MERGEABLE | - | 0 |
| fix/merge-middleware-n1-query | 140 | 4 | 2026-04-23 | - | - | 7 |
| fix/docker-dev-hot-reload | 131 | 4 | 2026-02-26 | - | - | 7 |
| feat/merge-middleware-into-proxy-ts | 130 | 7 | 2026-04-05 | #979 MERGEABLE | - | 0 |
| fix-restore-middleware-844 | 128 | 2 | 2026-03-21 | #846 MERGEABLE | - | 0 |
| fix/api-error-handling-validation | 124 | 4 | 2026-04-11 | #1053 MERGEABLE | - | 0 |
| fix/middleware-consolidation | 93 | 4 | 2026-04-03 | #953 MERGEABLE | fix/middleware-consolidation-v2 | 0 |
| fix/sentry-comprehensive-error-tracking | 92 | 10 | 2026-03-26 | #888 MERGEABLE | - | 0 |
| fix/ARCH-DRIFT-duplicate-middleware-headers | 91 | 5 | 2026-05-07 | - | - | 7 |
| fix/issue-860-merge-middleware-to-proxy | 91 | 5 | 2026-03-23 | #866 MERGEABLE | - | 0 |
| fix/merge-middleware-with-proxy | 91 | 4 | 2026-04-24 | #1208 MERGEABLE | - | 0 |
| fix/860-middleware-proxy-consolidation | 89 | 5 | 2026-03-23 | #867 MERGEABLE | - | 0 |
| fix/1185-merge-middleware | 88 | 7 | 2026-04-24 | #1199 MERGEABLE | - | 0 |
| fix/middleware-proxy-conflict | 87 | 4 | 2026-04-03 | #949 MERGEABLE | - | 0 |
| fix/FIX-BUILD-001-merge-middleware | 79 | 4 | 2026-04-10 | #1033 MERGEABLE | - | 0 |
| fix/860-merge-middleware-into-proxy | 76 | 2 | 2026-03-24 | #875 MERGEABLE | - | 0 |
| fix/FIX-BUILD-001-middleware-merge | 69 | 2 | 2026-04-10 | #1032 MERGEABLE | - | 0 |
| fix/merge-middleware-into-proxy | 68 | 2 | 2026-04-22 | #1176 MERGEABLE | - | 0 |
| fix/manager-issues-2026-04-17 | 67 | 9 | 2026-04-17 | #1109 MERGEABLE | - | 0 |
| fix/middleware-consolidation-v2 | 66 | 6 | 2026-05-06 | - | (canonical) | 2 |
| fix-1250-merge-middleware | 59 | 6 | 2026-04-30 | #1255 MERGEABLE | - | 0 |
| fix/860-merge-middleware-and-proxy | 54 | 2 | 2026-03-23 | #865 MERGEABLE | - | 0 |
| fix/api-error-handling-frontend-dx | 34 | 4 | 2026-04-11 | #1047 MERGEABLE | - | 0 |

**Reading the columns:** `open PR` shows the PR number and GitHub's `mergeable` state. `duplicate of` reads `(canonical)` when the branch is the one to keep. `deletion tier` points at `deletion-order.md`; tiers 0 and 1 are HOLD because an open PR would be closed by a deletion.

