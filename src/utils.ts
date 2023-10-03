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

export const cordConfigPath = path.join(os.homedir(), '.cord');
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
