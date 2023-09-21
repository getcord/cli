import type {
  ServerGetUser,
  ServerUpdateUser,
  ServerListUser,
  ServerUpdatePresence,
} from '@cord-sdk/types';
import type { Argv, InferredOptionTypes } from 'yargs';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';

async function listAllUsersHandler(argv: ListAllUsersOptionT) {
  const options = [
    {
      field: 'token',
      value: argv.token,
    },
    {
      field: 'limit',
      value: argv.limit,
    },
    {
      field: 'filter',
      value: argv.filter,
    },
  ];
  const queryParams = buildQueryParams(options);
  const users = await fetchCordRESTApi<ServerListUser>(`users${queryParams}`);
  prettyPrint(users);
}

async function getUserHandler(argv: IdPositionalT) {
  const user = await fetchCordRESTApi<ServerGetUser>(`users/${argv.id}`);
  prettyPrint(user);
}

async function createOrUpdateUserHandler(argv: CreateOrUpdateUserOptionsT) {
  const update: ServerUpdateUser = {
    email: argv.email,
    name: argv.name,
    shortName: argv.shortName,
  };
  const result = await fetchCordRESTApi(
    `users/${argv.id}`,
    'PUT',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

async function deleteUserHandler(argv: DeleteUserOptionsT) {
  const body = {
    permanently_delete: argv['permanently-delete'],
  };

  const result = await fetchCordRESTApi(
    `users/${argv.id}`,
    'DELETE',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function updateUserPresenceHandler(argv: UpdateUserPresenceOptionsT) {
  const body: ServerUpdatePresence = {
    organizationID: argv['organization-id'],
    location: JSON.parse(argv.location),
    durable: argv.durable,
    absent: argv.absent,
    exclusiveWithin: argv['exclusive-within']
      ? JSON.parse(argv['exclusive-within'])
      : undefined,
  };
  const result = await fetchCordRESTApi(
    `users/${argv.id}/presence`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function listAllPreferencesHandler(argv: IdPositionalT) {
  const preferences = await fetchCordRESTApi(`users/${argv.id}/preferences`);
  prettyPrint(preferences);
}

async function updatePreferencesHandler(argv: UpdatePreferencesOptionsT) {
  const body = {
    key: argv.key,
    value: JSON.parse(argv.value),
  };
  const result = await fetchCordRESTApi(
    `users/${argv.id}/preferences`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const updateUserPresenceOptions = {
  'organization-id': {
    description: 'the organization the user belongs to',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  location: {
    description: 'the location to set the user as present in as a json string',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  durable: {
    description:
      'when true, sets durable presence. When false, sets ephemeral presence',
    nargs: 1,
    boolean: true,
  },
  absent: {
    description:
      'when true, removes the user presence from the specified location',
    nargs: 1,
    boolean: true,
  },
  'exclusive-within': {
    description:
      'Clear presence at any other sub-location https://docs.cord.com/rest-apis/presence#exclusiveWithin',
    nargs: 1,
    string: true,
  },
} as const;

type UpdateUserPresenceOptionsT = IdPositionalT &
  InferredOptionTypes<typeof updateUserPresenceOptions>;

type DeleteUserOptionsT = IdPositionalT &
  InferredOptionTypes<typeof deleteUserOptions>;

const listAllUsersOptions = {
  limit: {
    description: 'max number of users to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'pagination token',
    nargs: 1,
    string: true,
  },
  filter: {
    description: 'filter object as a json string',
    nargs: 1,
    string: true,
  },
} as const;
type ListAllUsersOptionT = InferredOptionTypes<typeof listAllUsersOptions>;

const createOrUpdateUserOptions = {
  email: {
    description: 'email address of the user',
    nargs: 1,
    string: true,
  },
  name: {
    description: 'name of the user',
    nargs: 1,
    string: true,
  },
  shortName: {
    description: 'short (display) name of the user',
    nargs: 1,
    string: true,
  },
} as const;
type CreateOrUpdateUserOptionsT = IdPositionalT &
  InferredOptionTypes<typeof createOrUpdateUserOptions>;

const deleteUserOptions = {
  'permanently-delete': {
    description: 'user will only be deleted if true',
    nargs: 1,
    boolean: true,
  },
};

const updatePreferencesOptions = {
  key: {
    description: 'preference key. Defaults to "notification_channels"',
    nargs: 1,
    string: true,
    default: 'notification_channels',
  },
  value: {
    description:
      'updated preference value as a json string. Only updates the values that are passed.',
    nargs: 1,
    string: true,
    demandOption: true,
  },
} as const;
type UpdatePreferencesOptionsT = IdPositionalT &
  InferredOptionTypes<typeof updatePreferencesOptions>;

export const userCommand = {
  command: 'user',
  describe:
    'manipulate a user. For more info refer to docs: https://docs.cord.com/rest-apis/users',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .positional('id', idPositional.id)
      .command(
        'ls',
        'list all users',
        (yargs: Argv<IdPositionalT>) => yargs.options(listAllUsersOptions),
        listAllUsersHandler,
      )
      .command('get <id>', 'get a user', (yargs) => yargs, getUserHandler)
      .command(
        'create <id>',
        'create a user',
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(createOrUpdateUserOptions),
        createOrUpdateUserHandler,
      )
      .command(
        'update <id>',
        'update a user',
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(createOrUpdateUserOptions),
        createOrUpdateUserHandler,
      )
      .command(
        'update-presence <id>',
        "update a user's location",
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(updateUserPresenceOptions),
        updateUserPresenceHandler,
      )
      .command(
        'delete <id>',
        'delete a user',
        (yargs: Argv<IdPositionalT>) => yargs.options(deleteUserOptions),
        deleteUserHandler,
      )
      .command(
        'ls-preferences <id>',
        'list all preferences for a user',
        (yargs: Argv<IdPositionalT>) => yargs,
        listAllPreferencesHandler,
      )
      .command(
        'update-preferences <id>',
        'update preferences for a user',
        (yargs: Argv<IdPositionalT>) => yargs.options(updatePreferencesOptions),
        updatePreferencesHandler,
      );
  },
  handler: (_: unknown) => {},
};
