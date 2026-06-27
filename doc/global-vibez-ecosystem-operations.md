# Global Vibez Ecosystem Operations

This document defines how the Global Vibez repositories stay aligned when changes affect `globalvibezdsg.com`, release metadata, and downstream automation.

---

## Source of Truth

Use the following files in this repository as the coordination layer:

| File | Purpose |
|---|---|
| `integration/product-manifest.json` | Product metadata consumed by `globalvibezdsg.com` |
| `integration/companion-config.json` | Terminal-side links back to the companion website |
| `integration/ecosystem-map.json` | Machine-readable repo inventory, ownership map, and shared policy |
| `.github/workflows/validate-global-vibez-integration.yml` | Reusable validation workflow for the shared integration assets |
| `.github/workflows/global-vibez-sync.yml` | Cross-repo dispatcher triggered on release publication or manual sync |
| `.github/workflows/global-vibez-health-check.yml` | Scheduled monitoring workflow for the manifest and website surfaces |

---

## Repo Inventory and Ownership

The canonical inventory lives in `integration/ecosystem-map.json`.

Current coordinated repos:

| Repo | Role | Primary owner | Sync model |
|---|---|---|---|
| `Global-Vibez-DSG/intelligent-terminal` | Product repo and release source | `@johnnyh3611-bit` | Source repo |
| `johnnyh3611-bit/global_vibez_dsg1` | Companion website at `globalvibezdsg.com` | `@johnnyh3611-bit` | `repository_dispatch` listener |

When another Global Vibez repo needs synchronized updates, add it to `integration/ecosystem-map.json` first. The sync and health-check workflows read from that file.

---

## Shared Branch and Release Policy

- Default branch: `main`
- Stable releases: GitHub Releases published from `main`
- Prereleases: GitHub prereleases published from `main`
- Shared tag prefix: `v`
- Protected branches: every repo listed in `integration/ecosystem-map.json` should protect `main`
- Required review path: all changes that affect `integration/**`, `.github/workflows/**`, or public website links should merge through pull requests

Repository settings such as branch protection cannot be enforced from source control alone, so this document is the policy reference and `integration/ecosystem-map.json` is the machine-readable declaration for downstream automation.

---

## Dependency and Workflow Updates

Dependabot is configured in `.github/dependabot.yml` to keep the shared automation current on a single weekly window:

- GitHub Actions dependencies: every Monday at `09:00 UTC`
- Rust dependencies for `tools/wta`: every Monday at `09:00 UTC`

This keeps workflow and tooling updates clustered together instead of drifting across random days.

---

## Cross-Repo Sync Flow

The release-sync path is:

1. Publish a GitHub release in `Global-Vibez-DSG/intelligent-terminal`
2. `.github/workflows/update-manifest.yml` updates `integration/product-manifest.json`
3. `.github/workflows/global-vibez-sync.yml` validates the integration assets
4. The sync workflow dispatches `global-vibez-sync` to every downstream repo listed in `integration/ecosystem-map.json`
5. Downstream repos rebuild or refresh their website/deployment state from the payload URLs

### Required secret

Configure the following repository secret in `Global-Vibez-DSG/intelligent-terminal`:

- `GLOBAL_VIBEZ_REPO_SYNC_TOKEN` — a GitHub token with permission to trigger `repository_dispatch` on downstream repositories

### Dispatch payload

Downstream repos receive:

- `source_repo`
- `source_sha`
- `source_ref`
- `release_tag`
- `reason`
- `product_manifest_url`
- `companion_config_url`
- `target_repo_id`
- `target_sync_mode`
- `target_manifest_source`
- `target_website_surface`

Downstream repos should treat `product_manifest_url` as the source of truth instead of duplicating terminal product data locally.

---

## Monitoring and Operational Visibility

`.github/workflows/global-vibez-health-check.yml` runs daily and on demand. It:

- validates the shared integration files
- probes the raw product manifest URL
- probes `https://globalvibezdsg.com`
- probes `https://globalvibezdsg.com/terminal`
- publishes a JSON artifact and workflow summary

Use the workflow summary as the lightweight dashboard. If GitHub Actions notifications are enabled for this repo, a failed run becomes the alert channel.

---

## Rollback Model

If a sync introduces bad metadata or broken links:

1. Revert the change in this repository
2. Re-run `Global Vibez sync dispatch` manually with `workflow_dispatch`
3. If the issue is on the website only, fix the downstream repo and rebuild without changing the terminal release
4. If a published release is incorrect, publish a corrective release and let the manifest + sync flow propagate it

Do not hot-edit duplicated product metadata in downstream repos. Fix the source manifest here and sync again.

---

## Onboarding a New Repo

When another Global Vibez repo must stay in lockstep:

1. Add the repo to `integration/ecosystem-map.json`
2. Give the repo a clear role, owner, branch, and sync mode
3. Add a `repository_dispatch` listener in that repo for `global-vibez-sync`
4. Make that repo rebuild from shared URLs instead of hardcoded copies
5. Verify the repo appears in the next manual sync dispatch

This keeps all ecosystem coordination explicit, reviewable, and machine-readable.
