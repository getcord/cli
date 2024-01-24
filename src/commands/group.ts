import type { Argv, InferredOptionTypes } from 'yargs';
import type {
  ServerGetGroup,
  ServerListGroup,
  ServerListGroupMembers,
  ServerUpdateGroup,
  ServerUpdateGroupMembers,
} from '@cord-sdk/types';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';
import { buildQueryParams } from 'src/utils';

async function listAllOrgsHandler() {
  const orgs = await fetchCordRESTApi<ServerListGroup>(`groups`);
  prettyPrint(orgs);
}

async function getOrgHandler(argv: IdPositionalT) {
  const org = await fetchCordRESTApi<ServerGetGroup>(`groups/${argv.id}`);
  prettyPrint(org);
}

async function createOrUpdateOrgHandler(argv: CreateOrUpdateBaseOrgOptionsT) {
  const update: ServerUpdateGroup = {
    name: argv.name,
    status: argv.status,
    members: argv.members ? JSON.parse(argv.members) : undefined,
    metadata: argv.metadata ? JSON.parse(argv.metadata) : undefined,
  };
  const result = await fetchCordRESTApi(
    `groups/${argv.id}`,
    'PUT',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

async function deleteOrgHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(`groups/${argv.id}`, 'DELETE');
  prettyPrint(result);
}

async function listAllGroupMembersHandler(argv: ListAllGroupMembersOptionsT) {
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
  const groupMembers = await fetchCordRESTApi<ServerListGroupMembers>(
    `groups/${argv.id}/members${queryParams}`,
  );
  prettyPrint(groupMembers);
}

async function addMemberOrgHandler(argv: AddRemoveMemberOptionsT) {
  const update: ServerUpdateGroupMembers = { add: [argv.user] };
  const result = await fetchCordRESTApi(
    `groups/${argv.id}/members`,
    'POST',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

async function removeMemberOrgHandler(argv: AddRemoveMemberOptionsT) {
  const update: ServerUpdateGroupMembers = { remove: [argv.user] };
  const result = await fetchCordRESTApi(
    `groups/${argv.id}/members`,
    'POST',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

const createOrUpdateBaseOrgOptions = {
  name: {
    description: 'Name of the group',
    nargs: 1,
    string: true,
  },
  status: {
    description: 'Active status of the group',
    nargs: 1,
    choices: ['active', 'deleted'],
  },
  members: {
    description:
      'List of user IDs to be a part of this group as a json string. This will replace the existing set of members',
    nargs: 1,
    string: true,
  },
  metadata: {
    description: 'Metadata of the group as a json string',
    nargs: 1,
    string: true,
  },
} as const;
type CreateOrUpdateBaseOrgOptionsT = IdPositionalT &
  InferredOptionTypes<typeof createOrUpdateBaseOrgOptions>;

const createOrgOptions = {
  ...createOrUpdateBaseOrgOptions,
  name: {
    ...createOrUpdateBaseOrgOptions.name,
    demandOption: true,
  },
} as const;

const addRemoveMemberOptions = {
  user: {
    description: 'User to add or remove',
    nargs: 1,
    demandOption: true,
    string: true,
  },
} as const;
type AddRemoveMemberOptionsT = IdPositionalT &
  InferredOptionTypes<typeof addRemoveMemberOptions>;

const listAllGroupMembersParameters = {
  limit: {
    description: 'Max number of group members to return',
    nargs: 1,
    number: true,
  },
  token: {
    description: 'Pagination token',
    nargs: 1,
    string: true,
  },
} as const;

type ListAllGroupMembersOptionsT = IdPositionalT &
  InferredOptionTypes<typeof listAllGroupMembersParameters>;

export const groupCommand = {
  command: ['group', 'organization', 'org'],
  describe:
    'Manipulate groups. For more info refer to docs: https://docs.cord.com/rest-apis/groups',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all groups: GET https://api.cord.com/v1/groups',
        (yargs) => yargs,
        listAllOrgsHandler,
      )
      .command(
        'get <id>',
        'Get a group: GET https://api.cord.com/v1/groups/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getOrgHandler,
      )
      .command(
        'create <id>',
        'Create a group: PUT https://api.cord.com/v1/groups/<ID>',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(createOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'update <id>',
        'Update a group: PUT https://api.cord.com/v1/groups/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(createOrUpdateBaseOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'delete <id>',
        'Delete a group: DELETE https://api.cord.com/v1/groups/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteOrgHandler,
      )
      .command(
        'get-members <id>',
        'List all members in a group: GET https://api.cord.com/v1/groups/<ID>/members',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(listAllGroupMembersParameters),
        listAllGroupMembersHandler,
      )
      .command(
        'add-member <id>',
        'Add a member to a group: POST https://api.cord.com/v1/groups/<ID>/members',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(addRemoveMemberOptions),
        addMemberOrgHandler,
      )
      .command(
        'remove-member <id>',
        'Remove a member from a group: POST https://api.cord.com/v1/groups/<ID>/members',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(addRemoveMemberOptions),
        removeMemberOrgHandler,
      );
  },
  handler: (_: unknown) => {},
};
