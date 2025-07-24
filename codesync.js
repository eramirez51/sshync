#!/usr/bin/env node

import fs from 'fs';
import rsync from 'rsync';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_FILE = '.codesync.json';

function getVersion() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

function parseIgnoreFolders(args) {
  const ignoreIndex = args.findIndex(arg => arg === '--ignore');
  if (ignoreIndex === -1 || ignoreIndex === args.length - 1) {
    return { remainingArgs: args, ignoreFolders: [] };
  }
  
  const ignoreFoldersStr = args[ignoreIndex + 1];
  const ignoreFolders = ignoreFoldersStr.split(',').map(folder => folder.trim()).filter(folder => folder);
  
  // Remove --ignore and the folders list from args
  const remainingArgs = [...args];
  remainingArgs.splice(ignoreIndex, 2);
  
  return { remainingArgs, ignoreFolders };
}

function showHelp() {
  console.log(
    `${chalk.bold('codesync')} - Auto-sync code files or directories over SSH\n\n` +
    `${chalk.yellow('Usage:')}\n` +
    `  codesync <${chalk.blue('source')}> <user@ip[:port]:${chalk.green('destination')}> [--ignore ${chalk.magenta('folders')}]\n` +
    `  codesync init <${chalk.blue('source')}> <user@ip[:port]:${chalk.green('destination')}> [${chalk.cyan('filename')}] [--ignore ${chalk.magenta('folders')}]\n` +
    `  codesync load [${chalk.cyan('filename')}]\n` +
    `  codesync --version\n\n` +
    `${chalk.yellow('Commands:')}\n` +
    `  ${chalk.blue('source destination')}         Start syncing immediately\n` +
    `  ${chalk.blue('init source destination')}     Save settings to config file\n` +
    `  ${chalk.blue('load')}                        Load settings from config file and start syncing\n` +
    `  ${chalk.blue('--version, -v')}               Show version number\n\n` +
    `${chalk.yellow('Arguments:')}\n` +
    `  ${chalk.blue('source')}:\t\tlocal source file/folder\n` +
    `  ${chalk.green('destination')}:\tremote destination file/folder\n` +
    `  ${chalk.cyan('filename')}:\t\tsettings file name (default: ${SETTINGS_FILE})\n` +
    `  ${chalk.magenta('folders')}:\t\tcomma-separated list of folders to ignore\n\n` +
    `${chalk.yellow('Examples:')}\n` +
    `  codesync ./src user@server:/app --ignore node_modules,dist,.git\n` +
    `  codesync init ./src user@server:/app dev.json --ignore node_modules,tmp\n` +
    `  codesync --version`
  );
}

function initSettings(source, destination, filename = SETTINGS_FILE, ignoreFolders = []) {
  // Store relative path from current working directory
  const relativePath = path.relative(process.cwd(), path.resolve(source));
  const settings = {
    source: relativePath || '.', // Use '.' if source is current directory
    destination: destination,
    ignoreFolders: ignoreFolders,
    created: new Date().toISOString()
  };

  try {
    fs.writeFileSync(filename, JSON.stringify(settings, null, 2));
    console.log(chalk.green(`✓ Settings saved to ${filename}`));
    console.log(chalk.blue(`  Source: ${settings.source}`));
    console.log(chalk.blue(`  Destination: ${settings.destination}`));
    if (settings.ignoreFolders.length > 0) {
      console.log(chalk.blue(`  Ignore folders: ${settings.ignoreFolders.join(', ')}`));
    }
    console.log(chalk.gray(`  Run 'codesync load${filename !== SETTINGS_FILE ? ` ${filename}` : ''}' to start syncing`));
  } catch (error) {
    console.log(chalk.red(`✗ Failed to save settings: ${error.message}`));
    process.exit(1);
  }
}

function loadSettings(filename = SETTINGS_FILE) {
  try {
    if (!fs.existsSync(filename)) {
      console.log(chalk.red(`✗ Settings file ${filename} not found`));
      console.log(chalk.gray(`  Run 'codesync init <source> <destination>${filename !== SETTINGS_FILE ? ` ${filename}` : ''}' first`));
      process.exit(1);
    }

    const settings = JSON.parse(fs.readFileSync(filename, 'utf8'));
    
    if (!settings.source || !settings.destination) {
      console.log(chalk.red(`✗ Invalid settings file format`));
      process.exit(1);
    }

    console.log(chalk.green(`✓ Loaded settings from ${filename}`));
    console.log(chalk.blue(`  Source: ${settings.source} (relative to ${process.cwd()})`));
    console.log(chalk.blue(`  Destination: ${settings.destination}`));
    if (settings.ignoreFolders && settings.ignoreFolders.length > 0) {
      console.log(chalk.blue(`  Ignore folders: ${settings.ignoreFolders.join(', ')}`));
    }
    
    // Start syncing with loaded settings (source path is stored as relative)
    startSync(settings.source, settings.destination, settings.ignoreFolders || []);
    
  } catch (error) {
    console.log(chalk.red(`✗ Failed to load settings: ${error.message}`));
    process.exit(1);
  }
}

function startSync(sourcePath, destinationPath, ignoreFolders = []) {
  let edit = false;
  // Resolve relative path from current working directory
  const source = path.resolve(process.cwd(), sourcePath);
  const exclude = path.resolve(source, '.codesyncignore');
  const cmd = new rsync()
    .shell('ssh')
    .flags('avuz')
    .delete()
    .source(source)
    .destination(destinationPath);
  let handle;

  // Add .codesyncignore file if it exists
  if (fs.existsSync(exclude)) {
    cmd.set('exclude-from', exclude);
  }

  // Add ignore folders from command line or settings
  if (ignoreFolders.length > 0) {
    ignoreFolders.forEach(folder => {
      cmd.exclude(folder);
    });
  }

  // abort rsync on process exit
  function quit() {
    if (handle) {
      handle.kill();
    }
    process.exit();
  }

  process
    .on('SIGINT', quit)
    .on('SIGTERM', quit)
    .on('exit', quit);

  function contains(str, substr) {
    return str.includes(substr);
  }

  function print(line) {
    const isStats = contains(line, 'sent') && 
                    contains(line, 'received') && 
                    contains(line, 'bytes/sec');
    const prefix = edit ? chalk.yellow('✎ ') : chalk.green('✓ ');
    
    console.log(isStats ? chalk.blue(line) : prefix + line);
  }

  function sync() {
    handle = cmd.execute(
      (error, code, cmd) => {
        if (error) {
          console.log(chalk.red(error));
        }
        return 0;
      },
      (data) => {
        data
          .toString()
          .split('\n')
          .filter(line => line && contains(line, '/'))
          .forEach(print);
      }
    );
  }

  sync();
  fs.watch(source, { recursive: true }, () => {
    edit = true;
    sync();
  });
}

function main() {
  const rawArgs = process.argv.slice(2);
  
  // Handle version flag
  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    console.log(`codesync v${getVersion()}`);
    return;
  }
  
  const { remainingArgs: args, ignoreFolders } = parseIgnoreFolders(rawArgs);

  // Handle subcommands
  if (args.length >= 1) {
    const command = args[0];
    
    if (command === 'load') {
      const filename = args[1]; // Optional filename
      loadSettings(filename);
      return;
    }
    
    if (command === 'init' && args.length >= 3) {
      const source = args[1];
      const destination = args[2];
      const filename = args[3]; // Optional filename
      initSettings(source, destination, filename, ignoreFolders);
      return;
    }
  }

  if (args.length !== 2) {
    showHelp();
    return;
  }

  // Direct sync mode
  startSync(args[0], args[1], ignoreFolders);
}

main();