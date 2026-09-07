---
title: "Droplet"
summary: "A data-driven water state platform that normalizes environmental sources into cached, authenticated dashboards with AI-assisted observations."
slug: "droplet"
cover: "/images/droplet-cover.png"
alt: "Abstract water data platform cover with a droplet and contour map"
disciplines: ["development", "experiment"]
tags: ["React", "TypeScript", "PostgreSQL", "Redis", "Data platform", "AI"]
year: 2026
role: "Creator and maintainer"
featured: false
spatial: true
published: true
links: [{"label":"View repository","url":"https://github.com/kabaskill/droplet"},{"label":"Planned live site","url":"https://droplet.oguzkabasakal.com/"}]
embeds: []
---

Droplet is a Germany water state platform built as an operational dashboard for regional water conditions. It brings together source freshness, forecast pressure, normalized reservoir snapshots, and AI-assisted observations so the state of a region can be read in one place. The live site is planned for droplet.oguzkabasakal.com, but it is not public yet, so the repository is the current reference.

The system separates raw environmental data from the views the frontend consumes. The backend normalizes water and weather sources, sunlight, air quality, and exploratory CO2 context, stores snapshots in PostgreSQL, builds stable read models, and caches frequently used responses in Redis. Authenticated API endpoints serve the React frontend, with Keycloak available for local authentication. I worked across the backend, frontend, data flow, documentation, and deployment shape. The repo includes notes on source normalization, snapshot calculations, architecture, auth modes, production readiness, and how the dashboard is used.
