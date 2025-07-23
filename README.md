# codesync

Auto-sync code files or directories over SSH using [**rsync**](https://github.com/mattijs/node-rsync) and [fs.**watch**()](https://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener).

## TLDR - Quick Install from Nexus

```bash
# Install from internal Nexus repository
npm install -g codesync --registry=http://prod.nexus.infra.search-reco.unext-recommender-system.unext.me/repository/npm-internal/

# Start using immediately
codesync ./src user@server:/app --ignore node_modules,dist

# Or save configuration for later
codesync init ./src user@server:/app dev.json --ignore node_modules,dist
codesync load dev.json
```

![Animated usage GIF](example.gif)

Exclude files or directories by creating `.codesyncignore` in your source root (see repo root for example).

Default **rsync** options:

- `a` – archive mode
- `v` – verbose
- `u` – update
- `z` – compress

## Installation

```bash
$ npm install codesync -g

# Optional: Copy local SSH key to destination
# OSX: $ brew install ssh-copy-id
$ ssh-copy-id <user@ip[:port]>
```

## Usage

### Direct sync (immediate mode)

```bash
$ codesync <source> <user@ip[:port]:destination> [--ignore folders]
```

### Save and load configurations

```bash
# Save sync settings to a config file
$ codesync init <source> <user@ip[:port]:destination> [filename] [--ignore folders]

# Load and start syncing from saved config
$ codesync load [filename]
```

### Examples

**Basic usage:**

```bash
$ codesync ./local-folder user@192.168.1.100:/remote/path
```

**Using ignore folders:**

```bash
# Direct sync with ignored folders
$ codesync ./src user@server:/app --ignore node_modules,dist,.git

# Save config with ignored folders
$ codesync init ./src user@server:/app --ignore node_modules,tmp,dist
```

**Save configurations for different environments:**

```bash
# Save development config with specific ignore list
$ codesync init ./src user@dev.server.com:/app dev.json --ignore node_modules,tmp

# Save production config with different ignore list
$ codesync init ./src user@prod.server.com:/app prod.json --ignore node_modules,dist,.git

# Load and sync development environment
$ codesync load dev.json

# Load and sync production environment
$ codesync load prod.json

# Load default config (.codesync.json)
$ codesync load
```

### Configuration Files

Settings are stored as JSON files with the following structure:

```json
{
  "source": "./src",
  "destination": "user@host:/remote/path",
  "ignoreFolders": ["node_modules", "dist", ".git"],
  "created": "2025-07-23T23:29:14.436Z"
}
```

**Important:** Source paths are stored as **relative paths** from where `codesync init` was executed. When you run `codesync load`, the source path is resolved relative to your current working directory.

**Default filename:** `.codesync.json`  
**Custom filenames:** Any name you specify (e.g., `dev.json`, `staging.json`, `prod.json`)

### Folder Exclusion

codesync supports multiple ways to exclude files and folders:

1. **`.codesyncignore` file** - Place in your source root (similar to `.gitignore`)
2. **`--ignore` command line option** - Comma-separated list of folders
3. **Settings file** - Automatically stores and applies ignore list when using `load`

The ignore methods work together - both `.codesyncignore` and command line ignores are applied.

### Portable Configurations

Using relative paths makes your configurations portable and project-friendly:

```bash
# In your project root
$ codesync init ./src user@dev:/app dev.json
$ codesync init ./dist user@prod:/app prod.json

# Later, from the same project root
$ codesync load dev.json    # Works correctly
$ codesync load prod.json   # Works correctly

# From a different directory - will look for './src' relative to current location
$ cd some/other/path
$ codesync load /path/to/project/dev.json   # Will fail if './src' doesn't exist here
```

This allows you to maintain multiple sync configurations for different servers or environments with specific exclusion rules for each.

## Development

### Local Installation

To install this repository as a global command for development:

```bash
# Clone the repository
git clone https://github.com/eramirez51/codesync.git
cd codesync

# Install dependencies
npm install

# Install globally from local directory
npm install -g .

# Or create a development symlink (recommended for development)
npm link
```

### Development Workflow

Using `npm link` is recommended for development as it creates a symlink to your development directory:

```bash
# After making changes to the code
# No need to reinstall - changes are immediately available
codesync --help

# Test your changes
codesync init ./test user@server:/app test.json
```

### Testing Installation

Verify the global installation works:

```bash
# Check if codesync is available globally
which codesync

# Test the command
codesync

# Check installed version
npm list -g codesync
```

### Uninstalling

To remove the global installation:

```bash
# If installed with npm install -g
npm uninstall -g codesync

# If installed with npm link
npm unlink codesync
```

### Package Structure

- `codesync.js` - Main executable (entry point defined in package.json bin field)
- `package.json` - Package configuration with dependencies and bin mapping
- Node.js >=18.0.0 required (defined in engines field)
