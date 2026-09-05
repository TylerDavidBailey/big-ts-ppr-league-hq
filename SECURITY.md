# Security

## Scope

Sleeper League HQ is a static site with no backend, no accounts, and no server-side state.
It reads Sleeper's public read-only API from the browser.

The app holds no secrets. It sends no credentials. The only data it stores is a list of
recently opened league IDs in your own browser's `localStorage`, which never leaves your
device.

## Reporting a vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/TylerDavidBailey/sleeper-league-hq/security/advisories/new).
Do not open a public issue.

Include the steps to reproduce and the impact you see. Expect a first reply within seven
days.

## Out of scope

- Sleeper's own API and CDN. Report those to Sleeper.
- League data visibility. Sleeper decides what its public API exposes.
- Denial of service against Sleeper's API by calling this site repeatedly.
