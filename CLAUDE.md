# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser-based breakout (block-breaking) game. No build system or package manager — open `index.html` directly in a browser to run.

## Architecture

- **`index.html`**: Game shell with inline CSS, a `<canvas id="gameCanvas">` (480×360), and a `<script src="main.js">` tag.
- **`main.js`**: All game logic in a single file.

### main.js structure

- **Constants** at the top (canvas dimensions, brick layout, colors)
- **`init()`**: Resets all game state — paddle, balls array, bricks grid, score, lives, `gameState`
- **`update()`**: Called each frame; handles paddle movement, ball physics, wall/paddle/brick collisions, life loss, and clear detection
- **`draw()`**: Called each frame; renders bricks, paddle, balls, HUD, and overlay screens
- **`loop()`**: `requestAnimationFrame` loop that calls `update()` then `draw()`

### Game state

`gameState` is a string: `"playing"` | `"clear"` | `"gameover"`. Input handling and overlay rendering branch on this value.

### Special mechanic

Breaking a blue brick (`#4a90e2`, row index `% 5 === 4`) sets `shouldDouble = true`, which duplicates all surviving balls with reversed `dx` at end of frame.

## Environment

`ANTHROPIC_API_KEY` is set in `.env` (see `.env.example`).
