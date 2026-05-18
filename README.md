# RustFS S3 Object Storage — Jelastic/Virtuozzo JPS Template

One-click **S3-compatible object storage** (RustFS, Rust, Apache-2.0) for the
Jelastic/Virtuozzo Application Platform, with built-in HTTPS/domain mapping and a
safe long-term version-management workflow.

> **Status: BETA / not yet validated on a live platform.** RustFS is pre-1.0 beta.
> Every file marked `[VERIFY]` must be tested via **Import > JPS** on a real
> Jelastic/Virtuozzo environment before a marketplace release. Do not treat this
> as production-ready until the CI gate (below) passes on the target edition.

This is the **RustFS** repo. **SeaweedFS** ships as a *separate sibling repo*
sharing this exact pattern (production-recommended engine). There is **no runtime
engine selector** — engine is fixed per repo by design (see the research doc).

## Repo layout

| Path | Purpose |
|---|---|
| `manifest.jps` | Main `type:install` — wizard, `bl` LB + `cp` RustFS nodes, onInstall |
| `configs/vers.yaml` | Single source of version truth + tested-tag allowlist |
| `scripts/beforeInit.js` | Dynamic fields, image pin, cluster guard |
| `nginx/s3-proxy.conf.tpl` | SigV4-safe LB reverse-proxy contract |
| `addons/bind-ssl.jps` | Phase-2 "Bind SSL / Issue Certificate" button |
| `addons/change-version.jps` | "Change Version" upgrade button (backup→redeploy→verify) |
| `text/*.md` | Success / SSL / upgrade pages shown to the user |
| `tests/s3-smoke.sh` | Mandatory E2E (SigV4 / multipart / presigned) |
| `.github/workflows/ci.yml` | Install → test → teardown gate |

## Install options (wizard)

- **Topology:** `single` (default, production-safe) | `cluster` (EXPERIMENTAL —
  RustFS distributed is beta-unstable; ≥4 nodes; warning shown).
- **Public IP:** attach (default, recommended — required for custom-domain HTTPS) | none.
- **Your S3 domain:** optional; drives the two-phase SSL flow.

## Two-phase domain + HTTPS

1. **Install (Phase 1):** S3 comes up on temporary HTTP; the success page shows the
   assigned public IP and exact DNS A-record steps.
2. **After DNS propagates (Phase 2):** click **Bind SSL / Issue Certificate** —
   DNS is validated, a cert is issued/bound on the LB, the endpoint flips to
   `https://<your-domain>`. Idempotent; re-run for domain change / renewal.

S3 is **path-style only** — configure clients with force-path-style.

## Version management / upgrade runbook

Upgrades are user-driven via the **Change Version** add-on button:

1. Pick a **tested** version (only tags in `configs/vers.yaml` allowlist; never `latest`).
2. Confirm — a **backup is taken first** automatically.
3. Container is redeployed to the new tag **with volume data preserved**
   (`useExistingVolumes`).
4. Post-upgrade health + S3 smoke run automatically.

### Rollback

Run **Change Version** again, select the **previous** version, confirm. If the
on-disk format regressed, restore the pre-upgrade backup. Because RustFS is beta,
treat every upgrade as potentially breaking — always test on a non-prod env first.

## Release process (ruk-com Ops)

`master` = dev. To ship a new RustFS version:

1. Run CI against the candidate tag (s3-tests baseline + E2E smoke via LB).
2. On pass: add the tag to `configs/vers.yaml` `rustfs_allowlist` **and** the
   `change-version.jps` picker; bump `rustfs_default_tag` if it becomes the new default.
3. Cut Git tag `vX.Y.Z`; point the marketplace entry at that tag.
4. Existing environments do **not** auto-upgrade — customers upgrade via the button.

## Security defaults

Forced generated credentials (no default `rustfsadmin` reaching prod), console not
publicly exposed, TLS terminated at the LB, RustFS **CVE-2026-40937** mitigation
(lock notification-target endpoints) — see `manifest.jps` / research §Security.

## Known `[VERIFY]` items before release

LB nodeType name & conf.d/reload path · `AttachExtIp` / `RedeployContainers` /
backup-addon API param names on target edition · Let's Encrypt add-on TLS server
block vs our SigV4-safe directives on :443 · RustFS SigV4 Host validation with
`RUSTFS_SERVER_DOMAINS` unset · RustFS health GET-only quirk · s3-tests acceptance
baseline (OQ-6). Full list in the PRD open questions + research build-time flags.
