---
permalink: discussions/
layout: default
title: Release Posts
description: The release-post system - one announcing-vX.Y.Z.md per release, discussions-ready, lint-gated like every other docs surface.
---

# Release posts

One post per release, shaped like the family conventions in crashtest's release-post index ([crashtest's docs/discussions/index.md](https://github.com/__AUTHOR__/crashtest/blob/main/docs/discussions/index.md); first real post: [crashtest's announcing-v1.0.0](https://github.com/__AUTHOR__/crashtest/blob/main/docs/discussions/announcing-v1.0.0.md)). The post lives in `docs/discussions/` as versioned source so the release trail is in the same tree as the changelog it summarizes, and the file's raw markdown IS the announcement - view source, copy, strip the frontmatter, post.

Prose on these pages flows - paragraphs keep their natural length, and nothing in the toolchain re-wraps them at commit time. Hard-wrapped prose is a commit-time artifact, and it dies at every reflow of an upstream forum renderer. Tables and frontmatter keep their own natural line lengths.

## The conventions

- **One file per release, named after it.** `announcing-vX.Y.Z.md`, matching the npm version on the day the post is drafted. Never reuse a filename; if a release gets a retry, fold the delta into the same post instead.
- **Frontmatter contract.** Same four required fields every docs page gates on (`permalink`, `layout`, `title`, `description`) plus `version`. The permalink is `discussions/announcing-vX.Y.Z`.
- **Voice and facts.** The same rules every page here gates on (the style/voice checker plus the fiction-signature scanner): no marketing language, and every number and claim verified against the shipped artifact before it lands. If you cannot run it, do not write it.
- **Timing.** Draft the post against the released version, not the dev tree: cite what shipped in the npm tarball, and keep unreleased changelog rows out of it. A post describing a version that is not on npm yet is fiction by promotion. A post staged before its publish lands as a draft publicly marked "staged pending npm" in this index, and the draft marker comes off in the same commit that first serves the version - never earlier.
- **Gates.** `npm run lint:docs` runs on these files like everything else - frontmatter, heading levels, the dash and cliche scans, fiction signatures, and the Jekyll filter trap.

## The index

| post | version | live |
| --- | --- | --- |
