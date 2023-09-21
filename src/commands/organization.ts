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

async function createOrUpdateOrgHandler(argv: CreateOrUpdateOrgOptionsT) {
  const update: ServerUpdateOrganization = {
    name: argv.name,
    status: argv.status,
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

const createOrUpdateOrgOptions = {
  name: {
    description: 'name of the organization',
    nargs: 1,
    string: true,
  },
  status: {
    description: 'active status of the organization',
    nargs: 1,
    choices: ['active', 'deleted'],
  },
} as const;
type CreateOrUpdateOrgOptionsT = IdPositionalT &
  InferredOptionTypes<typeof createOrUpdateOrgOptions>;

const addRemoveMemberOptions = {
  user: {
    description: 'user to add or remove',
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
    'manipulate organizations.  For more info refer to docs: https://docs.cord.com/rest-apis/organizations',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .positional('id', idPositional.id)
      .command(
        'ls',
        'list all organizations',
        (yargs) => yargs,
        listAllOrgsHandler,
      )
      .command(
        'get <id>',
        'get an organization',
        (yargs) => yargs,
        getOrgHandler,
      )
      .command(
        'create <id>',
        'create an organization',
        (yargs: Argv<IdPositionalT>) => yargs.options(createOrUpdateOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'update <id>',
        'update an organization',
        (yargs: Argv<IdPositionalT>) => yargs.options(createOrUpdateOrgOptions),
        createOrUpdateOrgHandler,
      )
      .command(
        'delete <id>',
        'delete an organization',
        (yargs) => yargs,
        deleteOrgHandler,
      )
      .command(
        'add-member <id>',
        'add a member to an organization',
        (yargs: Argv<IdPositionalT>) => yargs.options(addRemoveMemberOptions),
        addMemberOrgHandler,
      )
      .command(
        'remove-member <id>',
        'remove a member to an organization',
        (yargs: Argv<IdPositionalT>) => yargs.options(addRemoveMemberOptions),
        removeMemberOrgHandler,
      );
  },
  handler: (_: unknown) => {},
};
