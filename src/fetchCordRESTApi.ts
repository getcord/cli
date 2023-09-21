import fetch from 'node-fetch';
import {
  getApplicationManagementAuthToken,
  getServerAuthToken,
} from '@cord-sdk/server';

const CORD_API_URL = 'https://api.cord.com/v1';

export async function fetchCordRESTApi<T>(
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body?: string,
): Promise<T> {
  const CORD_APP_ID = process.env.CORD_APP_ID;
  const CORD_SECRET = process.env.CORD_SECRET;

  if (!CORD_APP_ID || !CORD_SECRET) {
    throw new Error('Missing CORD_APP_ID or CORD_SECRET in the environment');
  }

  const serverAuthToken = getServerAuthToken(CORD_APP_ID, CORD_SECRET);
  const response = await fetch(`${CORD_API_URL}/${endpoint}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${serverAuthToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as T;
  } else {
    const responseText = await response.text();
    throw new Error(
      `Error making Cord API call: ${response.status} ${response.statusText} ${responseText}`,
    );
  }
}

export async function fetchCordManagementApi<T>(
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body?: string,
): Promise<T> {
  const CORD_CUSTOMER_ID = process.env.CORD_CUSTOMER_ID;
  const CORD_CUSTOMER_SECRET = process.env.CORD_CUSTOMER_SECRET;

  if (!CORD_CUSTOMER_ID || !CORD_CUSTOMER_SECRET) {
    throw new Error(
      'Missing CORD_CUSTOMER_ID or CORD_CUSTOMER_SECRET in the environment',
    );
  }

  const applicationManagementToken = getApplicationManagementAuthToken(
    CORD_CUSTOMER_ID,
    CORD_CUSTOMER_SECRET,
  );

  const response = await fetch(`${CORD_API_URL}/${endpoint}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${applicationManagementToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return response.json() as T;
  } else {
    const responseText = await response.text();
    throw new Error(
      `Error making Cord API call: ${response.status} ${response.statusText} ${responseText}`,
    );
  }
}
