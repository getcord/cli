import type { Argv, InferredOptionTypes } from 'yargs';
import type { QuestionCollection } from 'inquirer';
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
import { updateEnvVariables } from 'src/utils';

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
    iconURL: argv.iconUrl,
    eventWebhookURL: argv.eventWebhookUrl,
    redirectURI: argv.redirectUri,
    emailSettings: argv.emailSettings
      ? JSON.parse(argv.emailSettings)
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
    iconURL: argv.iconUrl,
    eventWebhookURL: argv.eventWebhookUrl,
    redirectURI: argv.redirectUri,
    emailSettings: argv.emailSettings
      ? JSON.parse(argv.emailSettings)
      : undefined,
  };
  const result = await fetchCordManagementApi(
    `applications/${argv.id}`,
    'PUT',
    JSON.stringify(body),
  );
  prettyPrint(result);
}

const confirmWithSecret: QuestionCollection<{ secret: string }> = [
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

async function deleteApplicationHandler(
  argv: IdPositionalT & { '--force'?: boolean; '-f'?: boolean },
) {
  let secret: string;
  if (argv['--force'] || argv['-f']) {
    ({ secret } = await fetchCordManagementApi<ApplicationData>(
      `applications/${argv.id}`,
    ));
  } else {
    ({ secret } = await inquirer.prompt(confirmWithSecret));
  }
  const result = await fetchCordManagementApi(
    `applications/${argv.id}`,
    'DELETE',
    JSON.stringify({ secret }),
  );
  prettyPrint(result);
}

async function selectApplicationHandler() {
  const apps = await fetchCordManagementApi<ApplicationData[]>('applications');
  const selectApp: QuestionCollection<{ selectedApp: string }> = [
    {
      name: 'selectedApp',
      message: 'Which app would you like to use?',
      type: 'list',
      choices: apps.map((app) => ({ name: app.name, value: app.id })),
    },
  ];
  const { selectedApp } = await inquirer.prompt(selectApp);
  const selectedAppDetails = await fetchCordManagementApi<ApplicationData>(
    `applications/${selectedApp}`,
  );
  await updateEnvVariables({
    CORD_APP_ID: selectedAppDetails.id,
    CORD_APP_SECRET: selectedAppDetails.secret,
  });
  prettyPrint(`You are now querying within ${selectedAppDetails.name}`);
}

const createOrUpdateBaseOptions = {
  iconUrl: {
    description: 'Url for application icon. Defaults to Cord logo',
    nargs: 1,
    string: true,
  },
  emailSettings: {
    description: 'Json string of your email settings object',
    nargs: 1,
    string: true,
  },
  eventWebhookUrl: {
    description: 'Url the events webhook is sent to',
    nargs: 1,
    string: true,
  },
  redirectUri: {
    description: 'Custom url link contained in email and slack notifications',
    nargs: 1,
    string: true,
  },
} as const;

const createApplicationOptions = {
  ...createOrUpdateBaseOptions,
  name: {
    description: 'Name of the application',
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
    ...createApplicationOptions.name,
    demandOption: false,
  },
} as const;

type UpdateApplicationOptionsT = InferredOptionTypes<
  typeof updateApplicationOptions
>;

export const applicationCommand = {
  command: ['application', 'app'],
  describe:
    'Manipulate applications. For more info refer to docs: https://docs.cord.com/rest-apis/applications',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        'ls',
        'List all applications: GET https://api.cord.com/v1/applications',
        (yargs) => yargs,
        listAllApplicationsHandler,
      )
      .command(
        'get <id>',
        'Get an application: GET https://api.cord.com/v1/applications/<ID>',
        (yargs: Argv) => yargs.positional('id', idPositional.id),
        getApplicationHandler,
      )
      .command(
        'create',
        'Create an application: POST https://api.cord.com/v1/applications',
        (yargs: Argv) => yargs.options(createApplicationOptions),
        createApplicationHandler,
      )
      .command(
        'update <id>',
        'Update an application: PUT https://api.cord.com/v1/applications/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .options(updateApplicationOptions),
        updateApplicationHandler,
      )
      .command(
        'delete [--force] <id>',
        'Delete an application: DELETE https://api.cord.com/v1/applications/<ID>',
        (yargs: Argv) =>
          yargs
            .positional('id', idPositional.id)
            .boolean(['--force', '-f'])
            .help(
              'force, -f',
              'delete without app secret. CAUTION! THIS WILL DELETE THE ENTIRE APPLICATION, INCLUDING ALL USERS, THREADS, AND MESSAGES!',
            ),
        deleteApplicationHandler,
      )
      .command(
        'select',
        'Select an app you would like to use',
        (yargs) => yargs,
        selectApplicationHandler,
      );
  },
  handler: (_: unknown) => {},
};
