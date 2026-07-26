import { execFileSync } from 'child_process';
import axios from './support/axios';

const GATEWAY_URL = 'http://localhost:5200';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin@system';

async function ensureRegisteredAdminUser() {
  try {
    await axios.post(`${GATEWAY_URL}/identity/auth/register`, {
      email: ADMIN_EMAIL,
      fullName: 'Admin System',
      password: ADMIN_PASSWORD,
    });
  } catch (error: any) {
    if (error?.response?.status !== 409) {
      throw error;
    }
  }

  execFileSync('docker', [
    'exec', '-u', 'postgres', 'manga-postgres',
    'psql', '-d', 'IdentityDB', '-v', 'ON_ERROR_STOP=1', '-c',
    `insert into user_roles (user_id, role_id)
     select u.id, r.id from users u cross join roles r
     where u.email='${ADMIN_EMAIL}' and r.name='Admin'
     on conflict do nothing;`
  ], { stdio: 'ignore' });
}

export default async function globalSetup() {
  await ensureRegisteredAdminUser();
}
