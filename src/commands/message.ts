import type { ServerCreateMessage, ServerUpdateMessage } from '@cord-sdk/types';
import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';

const threadIdOption = {
  'thread-id': {
    description: 'ID of the thread',
    nargs: 1,
    string: true,
    demandOption: true,
  },
} as const;

type ThreadIDOptionT = InferredOptionTypes<typeof threadIdOption>;

const optionalIdPositional = {
  id: {
    description: 'ID of the message',
    nargs: 1,
    string: true,
  },
} as const;

type OptionalIdPositionalT = InferredOptionTypes<typeof optionalIdPositional>;

async function listAllMessagesHandler(argv: ListAllMessageOptionsT) {
  const options = [
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
  const messages = await fetchCordRESTApi(`messages${queryParams}`);
  prettyPrint(messages);
}

async function getMessageHandler(argv: ThreadIDOptionT & IdPositionalT) {
  const message = await fetchCordRESTApi(
    `threads/${argv['thread-id']}/messages/${argv.id}`,
  );
  prettyPrint(message);
}

async function createMessageHandler(
  argv: CreateMessageOptionsT & OptionalIdPositionalT,
) {
  const body: ServerCreateMessage = {
    id: argv.id,
    url: argv.url,
    type: argv.type,
    authorID: argv['author-id'],
    extraClassnames: argv['extra-classnames'],
    iconURL: argv['icon-url'],
    content: argv.content ? JSON.parse(argv.content) : undefined,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    addReactions: argv['add-reactions']
      ? JSON.parse(argv['add-reactions'])
      : undefined,
    addAttachments: argv['add-attachments']
      ? JSON.parse(argv['add-attachments'])
      : undefined,
    createThread: argv['create-thread']
      ? JSON.parse(argv['create-thread'])
      : undefined,
    createdTimestamp: argv['created-timestamp']
      ? new Date(argv['created-timestamp'])
      : undefined,
    deletedTimestamp: argv['deleted-timestamp']
      ? new Date(argv['deleted-timestamp'])
      : undefined,
    updatedTimestamp: argv['updated-timestamp']
      ? new Date(argv['updated-timestamp'])
      : undefined,
  };

  const result = await fetchCordRESTApi(
    `threads/${argv['thread-id']}/messages`,
    'POST',
    JSON.stringify(body),
  );

  prettyPrint(result);
}

async function updateMessageHandler(argv: UpdateMessageOptionsT) {
  const body: ServerUpdateMessage = {
    url: argv.url,
    type: argv.type,
    id: argv['new-id'],
    authorID: argv['author-id'],
    extraClassnames: argv['extra-classnames'],
    iconURL: argv['icon-url'],
    content: argv.content ? JSON.parse(argv.content) : undefined,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
    addReactions: argv['add-reactions']
      ? JSON.parse(argv['add-reactions'])
      : undefined,
    addAttachments: argv['add-attachments']
      ? JSON.parse(argv['add-attachments'])
      : undefined,
    createdTimestamp: argv['created-timestamp']
      ? new Date(argv['created-timestamp'])
      : undefined,
    deletedTimestamp: argv['deleted-timestamp']
      ? new Date(argv['deleted-timestamp'])
      : undefined,
    updatedTimestamp: argv['updated-timestamp']
      ? new Date(argv['updated-timestamp'])
      : undefined,
  };
  const result = await fetchCordRESTApi(
    `threads/${argv['thread-id']}/messages/${argv.id}`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function deleteMessageHandler(argv: IdPositionalT & ThreadIDOptionT) {
  const result = await fetchCordRESTApi(
    `threads/${argv['thread-id']}/messages/${argv.id}`,
    'DELETE',
  );
  prettyPrint(result);
}

const listAllMessagesParameters = {
  limit: {
    description: 'Max number of messages to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'Pagination token',
    nargs: 1,
    string: true,
  },
} as const;

type ListAllMessageOptionsT = InferredOptionTypes<
  typeof listAllMessagesParameters
>;

const createOrUpdateBaseMessageOptions = {
  'add-reactions': {
    description: 'Reactions to add to this message as a json string',
    nargs: 1,
    string: true,
  },
  'add-attachments': {
    description: 'Attachments to add to this message as a json string',
    nargs: 1,
    string: true,
  },
  'author-id': {
    description: 'ID of the user who sent the message',
    nargs: 1,
    string: true,
  },
  content: {
    description: 'Content of the message as a json string',
    nargs: 1,
    string: true,
  },
  'icon-url': {
    description: 'Url of the icon to show next to an action message',
    nargs: 1,
    string: true,
  },
  'created-timestamp': {
    description: 'Timestamp the message was created',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'Metadata of the thread as a json string',
    nargs: 1,
    string: true,
  },
  url: {
    description: 'A url where the message can be seen',
    nargs: 1,
    string: true,
  },
  'deleted-timestamp': {
    description: 'Timestamp when the message was deleted',
    nargs: 1,
    string: true,
  },
  'updated-timestamp': {
    description: 'Timestamp when the message was updated',
    nargs: 1,
    string: true,
  },
  type: {
    description: 'Type of message',
    nargs: 1,
    choices: ['action_message', 'user_message'],
  },
  'extra-classnames': {
    description: 'A space separated list of classnames to add to the thread',
    nargs: 1,
    string: true,
  },
} as const;

const createMessageOptions = {
  ...createOrUpdateBaseMessageOptions,
  'create-thread': {
    description:
      "Parameters for creating a thread, if the thread doesn't exist yet, as a json string",
    nargs: 1,
    string: true,
  },
  'author-id': {
    ...createOrUpdateBaseMessageOptions['author-id'],
    demandOption: true,
  },
  content: {
    ...createOrUpdateBaseMessageOptions.content,
    demandOption: true,
  },
} as const;

const updateMessageOptions = {
  ...createOrUpdateBaseMessageOptions,
  'new-id': {
    description: 'Remove existing message id and replace with this new one',
    nargs: 1,
    string: true,
  },
} as const;

type CreateMessageOptionsT = ThreadIDOptionT &
  InferredOptionTypes<typeof createMessageOptions>;
type UpdateMessageOptionsT = ThreadIDOptionT &
  IdPositionalT &
  InferredOptionTypes<typeof updateMessageOptions>;

export const messageCommand = {
  command: 'message',
  description:
    'Manipulate messages. For more info refer to docs: https://docs.cord.com/rest-apis/messages',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all messages',
        (yargs: Argv) => yargs.options(listAllMessagesParameters),
        listAllMessagesHandler,
      )
      .command(
        'get <id>',
        'Get a message',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(threadIdOption),
        getMessageHandler,
      )
      .command(
        'create [id]',
        'Add a new message to a thread',
        (yargs: Argv) =>
          yargs
            .options({ ...createMessageOptions, ...threadIdOption })
            .options(threadIdOption)
            .positional('id', optionalIdPositional.id),
        createMessageHandler,
      )
      .command(
        'update <id>',
        'Update a message',
        (yargs: Argv) =>
          yargs
            .options({ ...updateMessageOptions, ...threadIdOption })
            .positional('id', idPositional.id),
        updateMessageHandler,
      )
      .command(
        'delete <id>',
        'Delete a message',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(threadIdOption),
        deleteMessageHandler,
      );
  },
  handler: (_: unknown) => {},
};
