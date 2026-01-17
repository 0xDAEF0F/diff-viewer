# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Diff Viewer is a desktop application for visualizing Git changes, built with Tauri (Rust backend) + React/TypeScript frontend.

## Build Commands

```bash
bun install          # Install dependencies
```

Development requires running both `bun run dev` and `bun run tauri dev` in separate terminals.

## Architecture

### Frontend (src/)
- **React 19** with TypeScript, **Vite 7** build tool, **Tailwind CSS 4**
- Single state container in `App.tsx` using React hooks
- Communicates with Rust backend via Tauri's `invoke()` IPC
- Diff rendering uses **diff2html** library

### Backend (src-tauri/)
- **Rust** with Tauri 2.x framework
- `git.rs` - Git operations using **git2** crate (status, diffs)
- `watcher.rs` - File system watching using **notify** crate with 300ms debounce
- `lib.rs` - Tauri command handlers bridging frontend to Git/watcher modules

## Key Guidelines

- use tailwindcss whenever possible
- do not put coauthourship when creating git commits
- do not run the development server just compile with tsc and cargo to check things are compiling
