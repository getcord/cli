import chalk from 'chalk';
import Box from 'cli-box';
import { getEnvVariables, updateEnvVariables } from 'src/utils';
import { fetchCordRESTApi } from 'src/fetchCordRESTApi';
import packageData from 'package.json';

export async function checkVersion() {
  const { VERSION_LAST_CHECKED } = await getEnvVariables();

  // we shouldn't fetch version or print update message if the version has been fetched within the last day
  if (VERSION_LAST_CHECKED) {
    const lastValidVersionDate = new Date(+VERSION_LAST_CHECKED);
    lastValidVersionDate.setDate(lastValidVersionDate.getDate() + 1);
    if (lastValidVersionDate.getTime() > Date.now()) {
      return;
    }
  }

  // fetch latest version from npm
  // update env variables
  // if outdated, print update message
  const res = await fetchCordRESTApi<{ version: string }>('cli-version');
  const publishedVersion: string = res.version;
  await updateEnvVariables({
    VERSION_LAST_CHECKED: Date.now().toString(),
  });

  if (publishedVersion !== packageData.version) {
    const box = Box(
      { h: 3, w: 50, stringify: false },
      `👋 ${chalk.bold('There is a newer version available!')}
To update from ${chalk.bold(packageData.version)} to ${chalk.bold(
        publishedVersion,
      )} run:
npm update -g @cord-sdk/cli\n`,
    );
    process.stderr.write(box.stringify() + '\n');
  }
}
