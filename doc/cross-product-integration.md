# Cross-Product Integration Guide

This document describes how **Intelligent Terminal** (`Global-Vibez-DSG/intelligent-terminal`) and the **Global Vibez companion website** (`johnnyh3611-bit/global_vibez_dsg1`, deployed at [globalvibezdsg.com](https://globalvibezdsg.com)) work together as two parts of one product story.

---

## Product Roles

| Repo | Role | Audience |
|------|------|----------|
| `intelligent-terminal` | Power-user desktop experience. AI-native Windows Terminal with agent pane, autofix, command palette, and wtcli automation. | Developers and power users on Windows |
| `global_vibez_dsg1` | Public-facing web platform. Community hub, product discovery, install portal, and the broader Global Vibez social experience. | Everyone — web users discover the terminal here |

Neither product depends on the other at runtime. Integration is achieved through **shared content and stable data files** committed in this repo.

---

## Integration Architecture

```
global_vibez_dsg1 (globalvibezdsg.com)
  └── fetches at build time ──────────────────────────────────┐
                                                               ▼
intelligent-terminal (this repo)                    integration/product-manifest.json
  └── publishes on release via                               (stable JSON)
      .github/workflows/update-manifest.yml
```

The website consumes `integration/product-manifest.json` from this repo's `main` branch via its raw GitHub URL:

```
https://raw.githubusercontent.com/Global-Vibez-DSG/intelligent-terminal/main/integration/product-manifest.json
```

The terminal's onboarding docs and help links point back to the website via `integration/companion-config.json`.

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `product-manifest.json` | **Source of truth** for product data: name, description, features, supported agents, install methods, screenshots, shortcuts, and links. Consumed by the website. |
| `product-manifest.schema.json` | JSON Schema for the manifest. Validates the manifest structure in CI and in editors. |
| `companion-config.json` | Terminal-side pointer back to the website. Used by onboarding flows and help links within the terminal. |

---

## User Journey

### Web → Terminal

1. User lands on [globalvibezdsg.com/terminal](https://globalvibezdsg.com/terminal)
2. Page renders features, screenshots, and install options **from `product-manifest.json`** — no manual copy-paste between repos needed
3. User clicks "Install from Microsoft Store" or copies the `winget` command
4. User opens Intelligent Terminal for the first time → agent pane onboarding
5. Help and support links in the onboarding flow point back to the website

### Terminal → Web

1. A command fails in the terminal → autofix detects it → agent suggests a fix
2. "Learn more" and "Community" links in terminal point to the website
3. Release notes in the terminal mention the website as the home base for community
4. Users looking for docs follow links that land on the website's terminal section

---

## Keeping the Integration Current

### On every release

The workflow `.github/workflows/update-manifest.yml` runs on `release: published`. It:

1. Reads the new version from the release tag
2. Updates `product.version` and `manifestMeta.lastUpdated` in `product-manifest.json`
3. Commits the change back to `main`

The website's next build (triggered separately in `global_vibez_dsg1`) fetches the updated manifest from `main` and rebuilds the terminal page automatically.

### When adding a new feature

1. Add an entry to `features[]` in `product-manifest.json`
2. Add the screenshot to `images/` and reference it in `imageUrl`
3. The website picks up the new feature on its next build — no website PR needed

### When adding a new supported agent

1. Add an entry to `supportedAgents[]` in `product-manifest.json`
2. The website's agent list updates on its next build

### When the website changes routing

1. Update the URLs in `integration/companion-config.json` (the `links` object)
2. The terminal's help links will point to the correct pages on the next release

---

## How the Website Consumes the Manifest

In `global_vibez_dsg1`, fetch the manifest at **build time**. The example below uses Next.js (which is the framework used by `global_vibez_dsg1`) with Incremental Static Regeneration:

```typescript
// src/app/terminal/page.tsx (implement in global_vibez_dsg1)
// Framework: Next.js 16 with App Router and ISR
import type { ProductManifest } from "@/types/product-manifest";

const MANIFEST_URL =
  "https://raw.githubusercontent.com/Global-Vibez-DSG/intelligent-terminal/main/integration/product-manifest.json";

export default async function TerminalPage() {
  // Revalidate once per hour so the page stays current without a full redeploy
  const manifest: ProductManifest = await fetch(MANIFEST_URL, {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  return (
    <main>
      <h1>{manifest.product.name}</h1>
      <p>{manifest.product.description}</p>
      {/* render features, agents, install options, etc. */}
    </main>
  );
}
```

The TypeScript types live in `global_vibez_dsg1` and should be kept in sync with `product-manifest.schema.json`. A CI step in `global_vibez_dsg1` can validate the fetched manifest against the schema on each build.

---

## Shared Content Ownership

| Content type | Source of truth | Who updates it |
|---|---|---|
| Feature names and descriptions | `integration/product-manifest.json` | `intelligent-terminal` team |
| Screenshots | `images/*.png` in this repo | `intelligent-terminal` team |
| Install links | `integration/product-manifest.json` | `intelligent-terminal` team |
| Supported agents list | `integration/product-manifest.json` | `intelligent-terminal` team |
| Keyboard shortcuts | `integration/product-manifest.json` | `intelligent-terminal` team |
| Release changelog | GitHub Releases in this repo | `intelligent-terminal` team |
| Website pages (UI, copy, layout) | `global_vibez_dsg1/src/app/terminal/` | `global_vibez_dsg1` team |
| Community content | `global_vibez_dsg1` | `global_vibez_dsg1` team |

The golden rule: **do not duplicate product data**. The manifest is the single source; the website renders from it.

---

## Release Communication Checklist

When publishing a new Intelligent Terminal release:

- [ ] Tag the release on GitHub — `update-manifest.yml` fires automatically and bumps `product.version`
- [ ] Verify the manifest is updated on `main` after the workflow completes
- [ ] Trigger or await the next website deployment in `global_vibez_dsg1` to pick up the new version
- [ ] Confirm the website's terminal page shows the new version and any new features
- [ ] Update `doc/faq.md` if the release resolves known FAQ items

---

## Avoiding Tight Coupling

- **No runtime dependency.** The terminal app does not call any globalvibezdsg.com APIs at runtime. The website does not call any terminal APIs at runtime. All integration is through static data files and links.
- **No shared code.** There is no shared npm/NuGet package between the two repos. Shared knowledge lives in JSON files and documentation.
- **Loose references.** Links from the terminal to the website use the `companion-config.json` values; links from the website to the terminal use the `product-manifest.json` values. Updating a URL requires only a one-line JSON change.
- **Independent deploys.** Both repos deploy independently. A broken build in one does not block the other.

Runtime integration (for example, the website calling the terminal's COM protocol to show live agent session status) is a future possibility but should only be added once the product roles and data integration are stable.

---

## Related Docs

- [`README.md`](../README.md) — Intelligent Terminal overview
- [`doc/faq.md`](faq.md) — Frequently asked questions
- [`doc/wtcli-commands.md`](wtcli-commands.md) — wtcli automation reference
- [`doc/installing-dependencies.md`](installing-dependencies.md) — prerequisite install guide
- [globalvibezdsg.com](https://globalvibezdsg.com) — companion website
