import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { sleep } from 'k6';
import { apiUrl } from './lib/config.js';

/**
 * Lista de credenciales: `USERS_FILE`, `load-tests/users.json`, `./users.json` o un solo usuario por defecto.
 * Si varias VUs comparten un único usuario, los logins concurrentes pueden invalidarse entre sí en Redis.
 */
const users = new SharedArray('users', function () {
  const fromEnv = __ENV.USERS_FILE;
  if (fromEnv) {
    try {
      return JSON.parse(open(fromEnv));
    } catch {
      console.warn(`No se pudo leer USERS_FILE=${fromEnv}`);
    }
  }
  for (const path of ['load-tests/users.json', './users.json']) {
    try {
      return JSON.parse(open(path));
    } catch {
      /* siguiente ruta */
    }
  }
  return [
    {
      email: __ENV.TEST_EMAIL || 'admin@enarm.test',
      password: __ENV.TEST_PASSWORD || 'Admin12345678',
    },
  ];
});

export const options = {
  vus: 20,
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

let jar = null;

export default function () {
  const cred = users[__VU % users.length];

  if (!jar) {
    jar = http.cookieJar();
    const loginRes = http.post(
      apiUrl('/api/auth/login'),
      JSON.stringify({ email: cred.email, password: cred.password }),
      {
        jar,
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      }
    );
    check(loginRes, {
      'login 200': (r) => r.status === 200,
    });
    sleep(0.05 + Math.random() * 0.05);
  }

  const specRes = http.get(apiUrl('/api/specialties'), { jar, tags: { name: 'specialties' } });
  check(specRes, {
    'specialties 200': (r) => r.status === 200,
  });

  const profileRes = http.get(apiUrl('/api/profile'), { jar, tags: { name: 'profile' } });
  check(profileRes, {
    'profile 200': (r) => r.status === 200,
  });
}
