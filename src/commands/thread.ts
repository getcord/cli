import type { Argv, InferredOptionTypes } from 'yargs';
import type {
  CoreMessageData,
  CoreThreadData,
  ThreadData,
  ServerUpdateThread,
  ServerCreateThread,
} from '@cord-sdk/types';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';

const optionalIdPositional = {
  id: {
    description: 'ID of the thread',
    nargs: 1,
    string: true,
  },
} as const;
type OptionalIdPositionalT = InferredOptionTypes<typeof optionalIdPositional>;

async function getThreadHandler(argv: IdPositionalT) {
  const thread = await fetchCordRESTApi<CoreThreadData>(`threads/${argv.id}`);
  prettyPrint(thread);
}

async function getThreadMessagesHandler(argv: GetMessageOptions) {
  const options = [
    {
      field: 'sortDirection',
      value: argv['sort-direction'],
    },
  ];
  const queryParams = buildQueryParams(options);

  const messages = await fetchCordRESTApi<CoreMessageData>(
    `threads/${argv.id}/messages${queryParams}`,
  );
  prettyPrint(messages);
}

async function createThreadHandler(
  argv: CreateThreadOptionsT & OptionalIdPositionalT,
) {
  const body: ServerCreateThread = {
    id: argv.id,
    name: argv.name,
    url: argv.url,
    groupID: argv['group-id'],
    location: JSON.parse(argv.location),
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    extraClassnames: argv['extra-classnames'],
    subscribers: argv.subscribers ? JSON.parse(argv.subscribers) : undefined,
  };

  const result = await fetchCordRESTApi(
    `threads`,
    'POST',
    JSON.stringify(body),
  );

  prettyPrint(result);
}

async function listAllThreadsHandler(argv: ListAllThreadsOptionsT) {
  const options = [
    {
      field: 'filter',
      value: argv.filter,
    },
    {
      field: 'token',
      value: argv.token,
    },
    {
      field: 'limit',
      value: argv.limit,
    },
  ];
  const queryParams = buildQueryParams(options);
  const threads = await fetchCordRESTApi<ThreadData[]>(`threads${queryParams}`);
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
    groupID: argv['group-id'],
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

const listAllThreadsParameters = {
  filter: {
    description: 'Partial match filter object as a json string',
    nargs: 1,
    string: true,
  },
  limit: {
    description: 'Max number of threads to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'Pagination token',
    nargs: 1,
    string: true,
  },
} as const;

type ListAllThreadsOptionsT = InferredOptionTypes<
  typeof listAllThreadsParameters
>;

const getMessagesParameters = {
  'sort-direction': {
    description:
      'returns messages in ascending or descending order of creation timestamp',
    nargs: 1,
    choices: ['ascending', 'descending'],
  },
} as const;

type GetMessageOptions = IdPositionalT &
  InferredOptionTypes<typeof getMessagesParameters>;

const createOrUpdateBaseThreadOptions = {
  name: {
    description: 'Name of the thread',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'Metadata of the thread as a json string',
    nargs: 1,
    string: true,
  },
  url: {
    description: 'A url where the thread can be seen',
    nargs: 1,
    string: true,
  },
  'group-id': {
    description: 'The group id this thread is in',
    nargs: 1,
    string: true,
  },
  'extra-classnames': {
    description: 'A space separated list of classnames to add to the thread',
    nargs: 1,
    string: true,
  },
  location: {
    description: 'The location of this thread as a json string',
    nargs: 1,
    string: true,
  },
} as const;

const createThreadOptions = {
  ...createOrUpdateBaseThreadOptions,
  name: {
    ...createOrUpdateBaseThreadOptions.name,
    demandOption: true,
  },
  url: {
    ...createOrUpdateBaseThreadOptions.url,
    demandOption: true,
  },
  'group-id': {
    ...createOrUpdateBaseThreadOptions['group-id'],
    demandOption: true,
  },
  location: {
    ...createOrUpdateBaseThreadOptions.location,
    demandOption: true,
  },
  // subscribers is only in the createThreadOptions
  subscribers: {
    description: 'A list of users to subscribe to this thread as a json string',
    nargs: 1,
    string: true,
  },
} as const;

type CreateThreadOptionsT = InferredOptionTypes<typeof createThreadOptions>;
const updateThreadOptions = {
  ...createOrUpdateBaseThreadOptions,
  'new-id': {
    description: 'Remove existing thread id and replace with this new one',
    nargs: 1,
    string: true,
  },
  'group-id': {
    ...createOrUpdateBaseThreadOptions['group-id'],
    alias: 'organization-id',
  },
  'resolved-timestamp': {
    description:
      'The timestamp when this thread was resolved, or null if not resolved',
    nargs: 1,
    string: true,
  },
  'user-id': {
    description:
      'The id of the user to be listed as the author of an action message (eg. "User un/resolved this thread") on certain changes to a thread',
    nargs: 1,
    string: true,
  },
  typing: {
    description:
      "A json array of user ids to mark them as typing in this thread. Pass an empty array to clear all users' typing indicators",
    nargs: 1,
    string: true,
  },
  resolved: {
    description: 'Whether the thread is resolved',
    nargs: 1,
    boolean: true,
  },
} as const;
type UpdateThreadOptionsT = IdPositionalT &
  InferredOptionTypes<typeof updateThreadOptions>;

export const threadCommand = {
  command: 'thread',
  describe:
    'Manipulate threads. For more info refer to docs: https://docs.cord.com/rest-apis/threads',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'get <id>',
        'Get a thread summary: GET https://api.cord.com/v1/threads/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getThreadHandler,
      )
      .command(
        'create [id]',
        'Create a new thread: POST https://api.cord.com/v1/threads',
        (yargs: Argv) =>
          yargs
            .options({ ...createThreadOptions })
            .positional('id', optionalIdPositional.id),
        createThreadHandler,
      )
      .command(
        'get-messages <id>',
        'Get messages in a thread: GET https://api.cord.com/v1/threads/<ID>/messages',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(getMessagesParameters),
        getThreadMessagesHandler,
      )
      .command(
        'ls',
        'List all threads: GET https://api.cord.com/v1/threads/',
        (yargs: Argv) => yargs.options(listAllThreadsParameters),
        listAllThreadsHandler,
      )
      .command(
        'update <id>',
        'Update a thread: PUT https://api.cord.com/v1/threads/<ID>',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(updateThreadOptions),
        updateThreadHandler,
      )
      .command(
        'delete <id>',
        'Delete a thread: DELETE https://api.cord.com/v1/threads/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteThreadHandler,
      );
  },
  handler: (_: unknown) => {},
};
