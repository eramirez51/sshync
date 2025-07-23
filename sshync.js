#!/usr/bin/env node

import fs from 'fs';
import rsync from 'rsync';
import path from 'path';
import chalk from 'chalk';

function main() {
  const args = process.argv.slice(2);
  let edit = false;

  if (args.length !== 2) {
    console.log(
      `sshync <${chalk.blue('source')}> <user@ip[:port]:${chalk.green('destination')}>\n` +
      `\t${chalk.blue('source')}:\t\tlocal source file/folder\n` +
      `\t${chalk.green('destination')}:\tremote destination file/folder`
    );
    return;
  }

  const source = path.resolve(args[0]);
  const exclude = path.resolve(source, '.sshyncignore');
  const cmd = new rsync()
    .shell('ssh')
    .flags('avuz')
    .delete() // This tells rsync to delete extraneous files from the receiving side
    .source(source)
    .destination(args[1]);
  let handle;

  if (fs.existsSync(exclude)) {
    cmd.set('exclude-from', exclude);
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

main();
