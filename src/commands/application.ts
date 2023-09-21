import type { Argv, InferredOptionTypes } from 'yargs';
import inquirer from 'inquirer';
import type {
  ApplicationData,
  ServerCreateApplication,
  ServerUpdateApplication,
} from '@cord-sdk/types';
import { fetchCordManagementApi } from 'src/fetchCordRESTApi';
import { idPositional } from 'src/positionalArgs';
import type { IdPositionalT } from 'src/positionalArgs';
import { prettyPrint } from 'src/prettyPrint';

async function listAllApplicationsHandler() {
  const apps = await fetchCordManagementApi<ApplicationData[]>('applications');
  prettyPrint(apps);
}

async function getApplicationHandler(argv: IdPositionalT) {
  const app = await fetchCordManagementApi<ApplicationData>(
    `applications/${argv.id}`,
  );
  prettyPrint(app);
}

async function createApplicationHandler(argv: CreateApplicationOptionsT) {
  const body: ServerCreateApplication = {
    name: argv.name,
    iconURL: argv['icon-url'],
    eventWebhookURL: argv['event-webhook-url'],
    redirectURI: argv['redirect-uri'],
    emailSettings: argv['email-settings']
      ? JSON.parse(argv['email-settings'])
      : undefined,
  };

  const result = await fetchCordManagementApi(
    'applications',
    'POST',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

async function updateApplicationHandler(
  argv: IdPositionalT & UpdateApplicationOptionsT,
) {
  const body: ServerUpdateApplication = {
    name: argv.name,
    iconURL: argv['icon-url'],
    eventWebhookURL: argv['event-webhook-url'],
    redirectURI: argv['redirect-uri'],
    emailSettings: argv['email-settings']
      ? JSON.parse(argv['email-settings'])
      : undefined,
  };
  const result = await fetchCordManagementApi(
    `applications/${argv.id}`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const confirmWithSecret = [
  {
    name: 'secret',
    message:
      'THIS WILL DELETE THE ENTIRE APPLICATION, INCLUDING ALL USERS, THREADS, AND MESSAGES. Enter the app secret to confirm you really want to delete all of this data:',
    type: 'input',
    validate: (answer: string) => {
      if (answer.length < 1) {
        return 'You must provide the app secret to delete the application';
      }
      return true;
    },
  },
];

async function deleteApplicationHandler(argv: IdPositionalT) {
  const { secret } = await inquirer.prompt(confirmWithSecret);

  const result = await fetchCordManagementApi(
    `applications/${argv.id}`,
    'DELETE',
    JSON.stringify({ secret }),
  );

  prettyPrint(result);
}

const createOrUpdateBaseOptions = {
  'icon-url': {
    description: 'url for application icon. Defaults to Cord logo',
    nargs: 1,
    string: true,
  },
  'email-settings': {
    description: 'json string of your email settings object',
    nargs: 1,
    string: true,
  },
  'event-webhook-url': {
    description: 'url the events webhook is sent to',
    nargs: 1,
    string: true,
  },
  'redirect-uri': {
    description: 'custom url link contained in email and slack notifications',
    nargs: 1,
    string: true,
  },
} as const;

const createApplicationOptions = {
  ...createOrUpdateBaseOptions,
  name: {
    description: 'name of the application',
    nargs: 1,
    string: true,
    demandOption: true,
  },
} as const;

type CreateApplicationOptionsT = InferredOptionTypes<
  typeof createApplicationOptions
>;

const updateApplicationOptions = {
  ...createOrUpdateBaseOptions,
  name: {
    description: 'name of the application',
    nargs: 1,
    string: true,
    demandOption: false,
  },
} as const;

type UpdateApplicationOptionsT = InferredOptionTypes<
  typeof updateApplicationOptions
>;

export const applicationCommand = {
  command: ['application', 'app'],
  describe:
    'manipulate applications. For more info refer to docs: https://docs.cord.com/rest-apis/applications',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'list all applications',
        (yargs) => yargs,
        listAllApplicationsHandler,
      )
      .command(
        'get <id>',
        'get an application',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getApplicationHandler,
      )
      .command(
        'create',
        'create an application',
        (yargs: Argv) => yargs.options(createApplicationOptions),
        createApplicationHandler,
      )
      .command(
        'update <id>',
        'update an application',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(updateApplicationOptions),
        updateApplicationHandler,
      )
      .command(
        'delete <id>',
        'delete an application',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        deleteApplicationHandler,
      );
  },
  handler: (_: unknown) => {},
};
