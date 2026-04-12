# Playwright MCP Setup

## Server

- Name: `playwright_cdp`
- Command: `node 01-runtime/tools/playwright-mcp-server.mjs`
- Mode: attach to the existing Chrome CDP session

## Purpose

Use this server when the task needs precise UI interaction instead of broad ad-hoc scripting.

## Available Actions

- list open pages
- capture page snapshot
- navigate to a page
- click a selector
- fill an input
- press a key
- wait for a selector state
- capture a screenshot
- run active-module regression

## Rules

- Start or reuse the CDP browser first.
- Prefer explicit selectors and a clear `page_hint`.
- Use page snapshots before and after important actions.
- Save screenshots when UI state matters to evidence.
- Keep Playwright MCP for precise UI work and use Oracle MCP only for safe read-only DB validation.