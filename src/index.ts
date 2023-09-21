#!/usr/bin/env node

import yargs from 'yargs';
import { threadCommand } from 'src/commands/thread';
import { userCommand } from 'src/commands/user';
import { organizationCommand } from 'src/commands/organization';
import { applicationCommand } from 'src/commands/application';
import { notificationCommand } from 'src/commands/notification';
import { messageCommand } from 'src/commands/message';

async function main(): Promise<void> {
  await yargs(process.argv.slice(2))
    .scriptName('cord')
    .usage('$0 <cmd> [args]')
    .strict()
    .demand(1)
    .command(organizationCommand)
    .command(threadCommand)
    .command(userCommand)
    .command(applicationCommand)
    .command(notificationCommand)
    .command(messageCommand)
    .help().argv;

  process.exit(0);
}

void main();
