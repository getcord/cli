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

async function listAllUsersHandler(argv: ListAllUsersOptionsT) {
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
    description: 'The organization the user belongs to',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  location: {
    description: 'The location to set the user as present in as a json string',
    nargs: 1,
    string: true,
    demandOption: true,
  },
  durable: {
    description:
      'When true, sets durable presence. When false, sets ephemeral presence',
    nargs: 1,
    boolean: true,
  },
  absent: {
    description:
      'When true, removes the user presence from the specified location',
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

const listAllUsersParameters = {
  limit: {
    description: 'Max number of users to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'Pagination token',
    nargs: 1,
    string: true,
  },
  filter: {
    description: 'Filter object as a json string',
    nargs: 1,
    string: true,
  },
} as const;
type ListAllUsersOptionsT = InferredOptionTypes<typeof listAllUsersParameters>;

const createOrUpdateUserOptions = {
  email: {
    description: 'Email address of the user',
    nargs: 1,
    string: true,
  },
  name: {
    description: 'Name of the user',
    nargs: 1,
    string: true,
  },
  shortName: {
    description: 'Short (display) name of the user',
    nargs: 1,
    string: true,
  },
} as const;
type CreateOrUpdateUserOptionsT = IdPositionalT &
  InferredOptionTypes<typeof createOrUpdateUserOptions>;

const deleteUserOptions = {
  'permanently-delete': {
    description: 'User will only be deleted if true',
    nargs: 1,
    boolean: true,
  },
};

const updatePreferencesOptions = {
  key: {
    description: 'Preference key. Defaults to "notification_channels"',
    nargs: 1,
    string: true,
    default: 'notification_channels',
  },
  value: {
    description:
      'Updated preference value as a json string. Only updates the values that are passed.',
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
    'Manipulate a user. For more info refer to docs: https://docs.cord.com/rest-apis/users',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .positional('id', idPositional.id)
      .command(
        'ls',
        'List all users',
        (yargs: Argv<IdPositionalT>) => yargs.options(listAllUsersParameters),
        listAllUsersHandler,
      )
      .command('get <id>', 'get a user', (yargs) => yargs, getUserHandler)
      .command(
        'create <id>',
        'Create a user',
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(createOrUpdateUserOptions),
        createOrUpdateUserHandler,
      )
      .command(
        'update <id>',
        'Update a user',
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(createOrUpdateUserOptions),
        createOrUpdateUserHandler,
      )
      .command(
        'update-presence <id>',
        "Update a user's location",
        (yargs: Argv<IdPositionalT>) =>
          yargs.options(updateUserPresenceOptions),
        updateUserPresenceHandler,
      )
      .command(
        'delete <id>',
        'Delete a user',
        (yargs: Argv<IdPositionalT>) => yargs.options(deleteUserOptions),
        deleteUserHandler,
      )
      .command(
        'ls-preferences <id>',
        'List all preferences for a user',
        (yargs: Argv<IdPositionalT>) => yargs,
        listAllPreferencesHandler,
      )
      .command(
        'update-preferences <id>',
        'Update preferences for a user',
        (yargs: Argv<IdPositionalT>) => yargs.options(updatePreferencesOptions),
        updatePreferencesHandler,
      );
  },
  handler: (_: unknown) => {},
};
