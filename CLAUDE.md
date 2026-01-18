# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Diff Viewer is a desktop application for visualizing Git changes, built with Tauri (Rust backend) + React/TypeScript frontend.

## Commands

```bash
bun install          # Install dependencies
```

## Architecture

### Frontend (src/)
- **React 19** with TypeScript, **Vite 7** build tool, **Tailwind CSS 4**
- Single state container in `App.tsx` using React hooks
- Communicates with Rust backend via Tauri's `invoke()` IPC

### Backend (src-tauri/)
- **Rust** with Tauri 2.x framework
- `git.rs` - Git operations using **git2** crate (status, diffs)
- `watcher.rs` - File system watching using **notify** crate with 300ms debounce
- `lib.rs` - Tauri command handlers bridging frontend to Git/watcher modules

## Key Guidelines

- use tailwindcss whenever possible
- do not put coauthourship when creating git commits
- commits should be one sentence ideally
- do not run the development server just compile with tsc and cargo to check things are compiling
- files should be less than 300 LOC
- maximum 1 component per file
