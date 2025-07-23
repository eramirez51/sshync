# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sshync is a minimal Node.js command-line tool for real-time file synchronization over SSH using rsync and `fs.watch()`. It automatically syncs local files/directories to remote destinations when changes are detected.

## Available Commands

### Basic Operations
- `npm install` - Install dependencies (`chalk` and `rsync`)
- `npm test` - Currently returns error (no tests implemented)

### sshync Commands
- `sshync <source> <destination> [--ignore folders]` - Start syncing immediately
- `sshync init <source> <destination> [filename] [--ignore folders]` - Save settings to config file
- `sshync load [filename]` - Load settings from config file and start syncing

### Ignore Folders
- `--ignore folder1,folder2,folder3` - Comma-separated list of folders to exclude from sync
- Works with both direct sync and init commands
- Stored in settings files and applied automatically when loading
- Combines with existing `.sshyncignore` file support

### Settings Files
- Default filename: `.sshync.json`
- Custom filenames allow multiple configurations (e.g., `dev.json`, `prod.json`)
- Settings files contain source path, destination, ignore folders list, and creation timestamp

### No Build Process
This is a single-file Node.js script with no compilation required. No build, lint, or development scripts are configured.

## Architecture

### Single File Design
The entire application is contained in `sshync.js` with these key components:
- Command-line argument parsing and validation
- rsync configuration with flags `avuz --delete`
- `.sshyncignore` file processing for exclusion patterns
- `fs.watch()` with recursive monitoring
- Signal handling for graceful shutdown
- Colored output using chalk

### Core Dependencies
- `chalk@^5.4.1` - Terminal styling (colors) - **Updated to latest version**
- `rsync@^0.6.1` - Node.js rsync wrapper - **Updated to latest version**

### File Exclusion
Uses `.sshyncignore` files (similar to `.gitignore`) to exclude files/directories from synchronization. Default exclusions include `node_modules` and `.git`.

## Development Notes

### Modern JavaScript
The codebase has been upgraded to use:
- ES modules (`import`/`export`) instead of CommonJS
- Modern JavaScript features (const/let, arrow functions, template literals)
- `String.includes()` instead of `indexOf()`
- Clean async/functional patterns

### No Testing Framework
The project currently has no tests or testing infrastructure. Any test implementation would need to be added from scratch.

### System Requirements
- **Node.js >= 18.0.0** (specified in engines field)
- rsync binary available on system
- SSH access to target destinations

### Code Style
- ES modules with modern import syntax
- Template literals for string interpolation
- Arrow functions for callbacks
- 2-space indentation
- Minimal error handling focused on user-friendly messages