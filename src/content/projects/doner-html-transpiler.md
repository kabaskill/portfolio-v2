---
title: "D.Ö.N.E.R"
summary: "A German-to-English HTML transpiler built with Go, React, and TypeScript."
slug: "doner-html-transpiler"
cover: "/images/doner.png"
alt: "DÖNER transpiler project artwork with code brackets and a döner illustration"
category: "development-design"
experiment: true
tags:
  - Go
  - React
  - TypeScript
  - HTML
role: "Developer"
year: 2025
links:
  - label: "Open experiment"
    url: "https://doner.oguzkabasakal.com"
  - label: "View repository"
    url: "https://github.com/kabaskill/doner-html-transpiler"
---

D.Ö.N.E.R, short for Deutsche Öffnung zur Normalisierten ERkennung, turns German HTML tags into standard HTML. I built the transpiler in Go while learning lexer, parser, and AST fundamentals, then connected it to a React and TypeScript interface.

The backend tokenizes the input, builds an abstract syntax tree, and generates HTML from the parsed representation. The current grammar covers around 50 tags and 20 attributes. The public service adds input limits, rate limiting, validation, sanitization, and XSS protection around the compiler so the browser interface can expose it without accepting arbitrary unsafe markup.

I used the project to work through the full path from source text to generated output: tokenization, parsing, tree transformation, and rendering. The live experiment shows the interface and the repository contains the Go compiler, the React client, and the surrounding API work.
