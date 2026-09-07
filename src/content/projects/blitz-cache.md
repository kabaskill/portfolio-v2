---
title: "blitz-cache"
summary: "A TypeScript-first data fetching and caching library with LRU storage, persistence, pagination, request cancellation, and React hooks."
slug: "blitz-cache"
cover: "/images/blitz-cache-cover.png"
alt: "Abstract data cache with layered tiles and request paths"
disciplines: ["development", "experiment"]
tags: ["TypeScript", "React", "Caching", "NPM", "Open source"]
year: 2026
role: "Creator and maintainer"
featured: false
spatial: true
published: true
links: [{"label":"View repository","url":"https://github.com/kabaskill/blitz-cache"},{"label":"View on npm","url":"https://www.npmjs.com/package/blitz-cache"}]
embeds: []
---

blitz-cache is a TypeScript-first data fetching and caching library for applications that need more control than a one-off fetch and less ceremony than a large data layer. The core library uses an LRU cache, supports stale-while-revalidate reads, persists data through pluggable storage adapters, and keeps duplicate requests from doing the same work twice. It also cancels older in-flight requests with AbortController, which matters when a search or filter changes before the previous response arrives.

The core package has no runtime dependency on React. It can be used from vanilla JavaScript, Vue, Svelte, or another frontend, while the React package adds useCache and useInfiniteCache hooks. React 19 projects can use useCacheSuspense with native Suspense boundaries. The library also includes offset, cursor, and page-number pagination helpers, optimistic updates, dependency-based invalidation, IndexedDB storage, prefetching, and a small DevTools package for cache hits, misses, age, and manual invalidation. I designed and maintain the package as an open-source project, with the repository and npm package linked here.
