import fs from 'fs';
import os from 'os';
import path from 'path';

export function buildQueryParams(
  args: {
    field: string;
    value: string | number | undefined;
  }[],
) {
  const params = new URLSearchParams();
  args.forEach(({ field, value }) => {
    if (value) {
      params.set(field, value.toString());
    }
  });
  return '?' + params.toString();
}

export const cordConfigPath =
  process.env.CORD_CONFIG_PATH ?? path.join(os.homedir(), '.cord');
const asyncFs = fs.promises;

export async function getEnvVariables() {
  const env: { [key: string]: string } = {};
  const data = await asyncFs.readFile(cordConfigPath, 'utf-8');
  if (data) {
    data
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .forEach((entry) => {
        const [key, value] = entry.split('=');
        env[key.trim()] = value.trim();
      });
  }
  return env;
}

export async function updateEnvVariables(newVariables: {
  [key: string]: string;
}) {
  const existingVariables = await getEnvVariables().catch(() => {
    /*no-op. probably just doesn't exist yet*/
  });
  const updatedVariables = {
    ...existingVariables,
    ...newVariables,
  };
  const envString = Object.entries(updatedVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(cordConfigPath, envString);
}

/**
 * Checks if `a` is a later version than `b`.
 * This will only work for versions in the format of NUMBER.NUMBER.NUMBER
 * We are okay with that here as we are always checking for this format.
 */
export function isLaterCliVersion(a: string, b: string) {
  const first = a.split('.');
  const second = b.split('.');

  for (let i = 0; i < first.length; i++) {
    if (+first[i] > +second[i]) {
      return true;
    }
    if (+first[i] < +second[i]) {
      return false;
    }
  }
  return false;
}
