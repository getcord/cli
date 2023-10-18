import type { Argv, InferredOptionTypes } from 'yargs';
import type {
  ServerGetOrganization,
  ServerListOrganization,
  ServerUpdateOrganization,
  ServerUpdateOrganizationMembers,
} from '@cord-sdk/types';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';

async function listAllOrgsHandler() {
  const orgs = await fetchCordRESTApi<ServerListOrganization>(`organizations`);
  prettyPrint(orgs);
}

async function getOrgHandler(argv: IdPositionalT) {
  const org = await fetchCordRESTApi<ServerGetOrganization>(
    `organizations/${argv.id}`,
  );
  prettyPrint(org);
}

async function createOrUpdateOrgHandler(argv: CreateOrUpdateBaseOrgOptionsT) {
  const update: ServerUpdateOrganization = {
    name: argv.name,
    status: argv.status,
    members: argv.members ? JSON.parse(argv.members) : undefined,
  };
  const result = await fetchCordRESTApi(
    `organizations/${argv.id}`,
    'PUT',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

async function deleteOrgHandler(argv: IdPositionalT) {
  const result = await fetchCordRESTApi(`organizations/${argv.id}`, 'DELETE');
  prettyPrint(result);
}

async function addMemberOrgHandler(argv: AddRemoveMemberOptionsT) {
  const update: ServerUpdateOrganizationMembers = { add: [argv.user] };
  const result = await fetchCordRESTApi(
    `organizations/${argv.id}/members`,
    'POST',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

async function removeMemberOrgHandler(argv: AddRemoveMemberOptionsT) {
  const update: ServerUpdateOrganizationMembers = { remove: [argv.user] };
  const result = await fetchCordRESTApi(
    `organizations/${argv.id}/members`,
    'POST',
    JSON.stringify(update),
  );
  prettyPrint(result);
}

const createOrUpdateBaseOrgOptions = {
  name: {
    description: 'Name of the organization',
    nargs: 1,
    string: true,
  },
  status: {
    description: 'Active status of the organization',
    nargs: 1,
    choices: ['active', 'deleted'],
  },
  members: {
    description:
      'List of user IDs to be a part of this organization as a json string. This will replace the existing set of members',
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

export const organizationCommand = {
  command: ['organization', 'org'],
  describe:
    'Manipulate organizations. For more info refer to docs: https://docs.cord.com/rest-apis/organizations',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all organizations: GET https://api.cord.com/v1/organizations',
        (yargs) => yargs,
        listAllOrgsHandler,
      )
      .command(
        'get <id>',
        'Get an organization: GET https://api.cord.com/v1/organizations/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getOrgHandler,
      )
      .command(
        'create <id>',
        'Create an organization: PUT https://api.cord.com/v1/organizations/<ID>',
        (yargs: Argv) =>
          yargs.positional('id', idPositional.id).options(createOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'update <id>',
        'Update an organization: PUT https://api.cord.com/v1/organizations/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(createOrUpdateBaseOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'delete <id>',
        'Delete an organization: DELETE https://api.cord.com/v1/organizations/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteOrgHandler,
      )
      .command(
        'add-member <id>',
        'Add a member to an organization: POST https://api.cord.com/v1/organizations/<ID>/members',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(addRemoveMemberOptions),
        addMemberOrgHandler,
      )
      .command(
        'remove-member <id>',
        'Remove a member to an organization: POST https://api.cord.com/v1/organizations/<ID>/members',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(addRemoveMemberOptions),
        removeMemberOrgHandler,
      );
  },
  handler: (_: unknown) => {},
};
