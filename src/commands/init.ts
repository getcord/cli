import fs from 'fs';
import type { Argv } from 'yargs';
import type { QuestionCollection } from 'inquirer';
import inquirer from 'inquirer';
import { prettyPrint } from 'src/prettyPrint';
import { getEnvVariables, cordConfigPath } from 'src/utils';

async function initializeCord() {
  const defaultAnswers = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  console.log(
    'All of the following can be found at https://console.cord.com/applications',
  );
  const questions: QuestionCollection<{
    CORD_APP_ID: string;
    CORD_APP_SECRET: string;
    requiresAppCommands: boolean;
    CORD_CUSTOMER_ID?: string;
    CORD_CUSTOMER_SECRET?: string;
  }> = [
    {
      name: 'CORD_APP_ID',
      default: defaultAnswers?.CORD_APP_ID,
      message: 'The ID of the application you wish you query within:',
      type: 'input',
      validate: (answer: string) => {
        if (answer.length < 1) {
          return 'This is required to run the commands';
        }
        return true;
      },
    },
    {
      name: 'CORD_APP_SECRET',
      default: defaultAnswers?.CORD_APP_SECRET,
      message: 'The secret of the application you wish to query within:',
      type: 'input',
      validate: (answer: string) => {
        if (answer.length < 1) {
          return 'This is required to run the commands';
        }
        return true;
      },
    },
    {
      name: 'requiresAppCommands',
      message:
        'Will you be running any application management commands? (You will need extra credentials):',
      type: 'confirm',
      default: false,
    },
    {
      name: 'CORD_CUSTOMER_ID',
      default: defaultAnswers?.CORD_CUSTOMER_ID,
      message:
        'Find your customer ID and secret by clicking the "View application management credentials" button at the upper right of https://console.cord.com/applications. Your customer ID:',
      type: 'input',
      when: (currentAnswers) => currentAnswers.requiresAppCommands,
    },
    {
      name: 'CORD_CUSTOMER_SECRET',
      default: defaultAnswers?.CORD_CUSTOMER_SECRET,
      message: 'Your customer secret:',
      type: 'input',
      when: (currentAnswers) => currentAnswers.requiresAppCommands,
    },
  ];

  const {
    CORD_APP_ID,
    CORD_APP_SECRET,
    CORD_CUSTOMER_ID,
    CORD_CUSTOMER_SECRET,
  } = await inquirer.prompt(questions);
  const includeCustomerID =
    CORD_CUSTOMER_ID && CORD_CUSTOMER_ID.trim().length > 0;
  const includeCustomerSecret =
    CORD_CUSTOMER_SECRET && CORD_CUSTOMER_SECRET.trim().length > 0;

  fs.writeFileSync(
    cordConfigPath,
    `CORD_APP_ID=${CORD_APP_ID}
CORD_APP_SECRET=${CORD_APP_SECRET}
${includeCustomerID ? `CORD_CUSTOMER_ID=${CORD_CUSTOMER_ID}` : ''}
${includeCustomerSecret ? `CORD_CUSTOMER_SECRET=${CORD_CUSTOMER_SECRET}` : ''}
  `,
  );
  console.log(
    'These variables have now been added to a .cord file in your home directory:',
  );
  prettyPrint({
    CORD_APP_ID,
    CORD_APP_SECRET,
    ...(includeCustomerID ? { CORD_CUSTOMER_ID } : {}),
    ...(includeCustomerSecret ? { CORD_CUSTOMER_SECRET } : {}),
  });

  if (includeCustomerID && !includeCustomerSecret) {
    console.log(
      'You will still need to configure your customer secret to execute application commands.',
    );
  }
}
export const initCommand = {
  command: 'init',
  description: 'Initialize your Cord instance',
  builder: (yargs: Argv) => {
    return yargs
      .demand(1)
      .command(
        '$0',
        'Initialize your Cord instance',
        (yargs) => yargs,
        initializeCord,
      );
  },
  handler: (_: unknown) => {},
};
