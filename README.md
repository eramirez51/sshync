# sshync

Auto-sync files or directories over SSH using [**rsync**](https://github.com/mattijs/node-rsync) and [fs.**watch**()](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener).

![Animated usage GIF](example.gif)

Exclude files or directories by creating `.sshyncignore` in your source root (see repo root for example).

Default **rsync** options:

- `a` – archive mode
- `v` – verbose
- `u` – update
- `z` – compress

## Installation

```bash
$ npm install sshync -g

# Optional: Copy local SSH key to destination
# OSX: $ brew install ssh-copy-id
$ ssh-copy-id <user@ip[:port]>
```

## Usage

### Direct sync (immediate mode)

```bash
$ sshync <source> <user@ip[:port]:destination> [--ignore folders]
```

### Save and load configurations

```bash
# Save sync settings to a config file
$ sshync init <source> <user@ip[:port]:destination> [filename] [--ignore folders]

# Load and start syncing from saved config
$ sshync load [filename]
```

### Examples

**Basic usage:**

```bash
$ sshync ./local-folder user@192.168.1.100:/remote/path
```

**Using ignore folders:**

```bash
# Direct sync with ignored folders
$ sshync ./src user@server:/app --ignore node_modules,dist,.git

# Save config with ignored folders
$ sshync init ./src user@server:/app --ignore node_modules,tmp,dist
```

**Save configurations for different environments:**

```bash
# Save development config with specific ignore list
$ sshync init ./src user@dev.server.com:/app dev.json --ignore node_modules,tmp

# Save production config with different ignore list
$ sshync init ./src user@prod.server.com:/app prod.json --ignore node_modules,dist,.git

# Load and sync development environment
$ sshync load dev.json

# Load and sync production environment
$ sshync load prod.json

# Load default config (.sshync.json)
$ sshync load
```

### Configuration Files

Settings are stored as JSON files with the following structure:

```json
{
  "source": "/absolute/path/to/source",
  "destination": "user@host:/remote/path",
  "ignoreFolders": ["node_modules", "dist", ".git"],
  "created": "2025-07-23T23:29:14.436Z"
}
```

**Default filename:** `.sshync.json`  
**Custom filenames:** Any name you specify (e.g., `dev.json`, `staging.json`, `prod.json`)

### Folder Exclusion

sshync supports multiple ways to exclude files and folders:

1. **`.sshyncignore` file** - Place in your source root (similar to `.gitignore`)
2. **`--ignore` command line option** - Comma-separated list of folders
3. **Settings file** - Automatically stores and applies ignore list when using `load`

The ignore methods work together - both `.sshyncignore` and command line ignores are applied.

This allows you to maintain multiple sync configurations for different servers or environments with specific exclusion rules for each.
