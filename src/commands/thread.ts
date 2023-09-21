import type { Argv, InferredOptionTypes } from 'yargs';
import type {
  CoreMessageData,
  CoreThreadData,
  ThreadData,
  ServerUpdateThread,
} from '@cord-sdk/types';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';

async function getThreadHandler(argv: IdPositionalT) {
  const thread = await fetchCordRESTApi<CoreThreadData>(`threads/${argv.id}`);
  prettyPrint(thread);
}

async function getThreadMessagesHandler(argv: IdPositionalT) {
  const messages = await fetchCordRESTApi<CoreMessageData>(
    `threads/${argv.id}/messages`,
  );
  prettyPrint(messages);
}

async function listAllThreadsHandler() {
  const threads = await fetchCordRESTApi<ThreadData[]>(`threads`);
  prettyPrint(threads);
}

async function deleteThreadHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(`threads/${argv.id}`, 'DELETE');
  prettyPrint(result);
}

async function updateThreadHandler(argv: UpdateThreadOptionsT) {
  const update: ServerUpdateThread = {
    name: argv.name,
    resolved: argv.resolved,
    url: argv.url,
    id: argv['new-id'],
    organizationID: argv['organization-id'],
    extraClassnames: argv['extra-classnames'],
    userID: argv['user-id'],
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    location: argv.location ? JSON.parse(argv.location) : undefined,
    typing: argv.typing ? JSON.parse(argv.typing) : undefined,
    resolvedTimestamp:
      typeof argv['resolved-timestamp'] === 'string'
        ? new Date(argv['resolved-timestamp'])
        : argv['resolved-timestamp'],
  };

  const result = await fetchCordRESTApi(
    `threads/${argv.id}`,
    'PUT',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

const updateThreadOptions = {
  name: {
    description: 'name of the thread',
    nargs: 1,
    string: true,
  },
  'new-id': {
    description: 'id of the thread',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'metadata of the thread as a json string',
    nargs: 1,
    string: true,
  },
  url: {
    description: 'a url where the thread can be seen',
    nargs: 1,
    string: true,
  },
  'organization-id': {
    description: 'the organization id this thread is in',
    nargs: 1,
    string: true,
  },
  'extra-classnames': {
    description: 'a space separated list of classnames to add to the thread',
    nargs: 1,
    string: true,
  },
  location: {
    description: 'the location of this thread as a json string',
    nargs: 1,
    string: true,
  },
  'resolved-timestamp': {
    description:
      'the timestamp when this thread was resolved, or null if not resolved',
    nargs: 1,
    string: true,
  },
  'user-id': {
    description:
      'the id of the user to be listed as the author of an action message (eg. "User un/resolved this thread") on certain changes to a thread',
    nargs: 1,
    string: true,
  },
  typing: {
    description:
      "a json array of user ids to mark them as typing in this thread. Pass an empty array to clear all users' typing indicators",
    nargs: 1,
    string: true,
  },
  resolved: {
    description: 'whether the thread is resolved',
    nargs: 1,
    boolean: true,
  },
} as const;
type UpdateThreadOptionsT = IdPositionalT &
  InferredOptionTypes<typeof updateThreadOptions>;

export const threadCommand = {
  command: 'thread',
  describe:
    'manipulate threads. For more info refer to docs: https://docs.cord.com/rest-apis/threads',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .positional('id', idPositional.id)
      .command(
        'get <id>',
        'get a thread summary',
        (yargs) => yargs,
        getThreadHandler,
      )
      .command(
        'get-messages <id>',
        'get messages in a thread',
        (yargs) => yargs,
        getThreadMessagesHandler,
      )
      .command(
        'ls',
        'list all threads',
        (yargs) => yargs,
        listAllThreadsHandler,
      )
      .command(
        'update <id>',
        'update a thread',
        (yargs: Argv<IdPositionalT>) => yargs.options(updateThreadOptions),
        updateThreadHandler,
      )
      .command(
        'delete <id>',
        'delete a thread',
        (yargs) => yargs,
        deleteThreadHandler,
      );
  },
  handler: (_: unknown) => {},
};
