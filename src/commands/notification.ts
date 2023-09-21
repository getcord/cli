import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional, userIdPositional } from 'src/positionalArgs';
import type { IdPositionalT, UserIdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';

async function listAllNotificationsHandler(argv: UserIdPositionalT) {
  const notifications = await fetchCordRESTApi(
    `users/${argv['user-id']}/notifications`,
  );
  prettyPrint(notifications);
}

async function createNotificationHandler(argv: CreateNotificationOptionsT) {
  const body = {
    type: argv.type,
    url: argv.url,
    template: argv.template,
    recipientID: argv['recipient-id'],
    actorID: argv['actor-id'],
    iconUrl: argv['icon-url'],
    extraClassnames: argv['extra-classnames'],
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
  };
  const result = await fetchCordRESTApi(
    'notifications',
    'POST',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const createNotificationOptions = {
  'recipient-id': {
    description: 'id of the user receiving the notification',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  'actor-id': {
    description: 'id of the user who is sending the notification',
    nargs: 1,
    string: true,
  },
  template: {
    description: 'template for the header of the notification',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  url: {
    description: 'url of a page to go to when the notification is clicked',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  'icon-url': {
    description: 'url of an icon image',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'metadata of the notification as a json string',
    nargs: 1,
    string: true,
  },
  'extra-classnames': {
    description:
      'a space separated list of classnames to add to the notification',
    nargs: 1,
    string: true,
  },
  type: {
    description: 'Currently must be set to "url"',
    nargs: 1,
    string: true,
    default: 'url',
  },
} as const;
type CreateNotificationOptionsT = InferredOptionTypes<
  typeof createNotificationOptions
>;

async function deleteNotificationHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(`notifications/${argv.id}`, 'DELETE');
  prettyPrint(result);
}

export const notificationCommand = {
  command: 'notification',
  describe:
    'manipulate notifications. For more info refer to docs: https://docs.cord.com/rest-apis/notifications',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls <user-id>',
        'list all notifications a user has received',
        (yargs: Argv) =>
          yargs.positional('user-id', userIdPositional['user-id']),
        listAllNotificationsHandler,
      )
      .command(
        'create',
        'create a notification',
        (yargs: Argv) => yargs.options(createNotificationOptions),
        createNotificationHandler,
      )
      .command(
        'delete <id>',
        'delete a notification',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteNotificationHandler,
      );
  },
  handler: (_: unknown) => {},
};
