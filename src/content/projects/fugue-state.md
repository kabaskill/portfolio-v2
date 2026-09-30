---
title: "Fugue State"
summary: "A gamified music-theory application that turns listening, notation, and repetition into an approachable learning loop."
slug: "fugue-state"
cover: "../../assets/images/FugueState-1.png"
alt: "Fugue State music theory application title artwork"
categories:
  - "development-design"
  - "experiment"
year: 2024
tags:
  - "React"
  - "Game design"
  - "Music theory"
role: "Developer"
featured: false
published: true
links:
  - label: "View repository"
    url: "https://github.com/kabaskill/fugue-state-react"
embeds: []
gallery: []
---

Fugue State is a browser-based music theory game I built for my master thesis. Its deck-builder loop asks the player to identify the same chord through scientific notation, solfege, and chromatic note names.

I worked on the product idea, interface, game rules, and implementation. Tonal.js handles music-theory calculations, Tone.js handles browser audio, abc.js supports notation, and Preact Signals manages game state. The main implementation problem was keeping the answer, notation, audio, and score state in sync during a run. The repository contains the React and Vite implementation.
