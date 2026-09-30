---
title: "blitz-cache"
summary: "A TypeScript-first data fetching and caching library with LRU storage, persistence, pagination, request cancellation, and React hooks."
slug: "blitz-cache"
cover: "../../assets/images/blitz-cache-cover.jpg"
alt: "Abstract data cache with layered tiles and request paths"
categories:
  - "development-design"
  - "experiment"
tags:
  - "TypeScript"
  - "React"
  - "Caching"
  - "NPM"
  - "Open source"
year: 2026
role: "Creator and maintainer"
featured: false
published: true
links:
  - label: "View repository"
    url: "https://github.com/kabaskill/blitz-cache"
  - label: "View on npm"
    url: "https://www.npmjs.com/package/blitz-cache"
embeds: []
gallery: []
---

blitz-cache is a TypeScript data-fetching and caching library. The core uses an LRU cache, stale-while-revalidate reads, pluggable persistence, request deduplication, and AbortController cancellation for stale requests.

The core package has no runtime dependency on React. I added adapters for vanilla JavaScript and other frontends, React hooks, pagination, optimistic updates, dependency-based invalidation, IndexedDB storage, prefetching, and a small DevTools package. I designed the public API around predictable cache keys, explicit invalidation, and cancellation, and maintain the package and documentation as an open-source project.
