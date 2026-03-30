import http from 'k6/http';
import { check } from 'k6';
import { apiUrl } from './lib/config.js';

/**
 * Estrés sobre GET /api/health (API + Redis + MySQL).
 * Ajusta `stages` para subir VUs hasta ver degradación; revisa umbrales y `http_req_failed`.
 */
export const options = {
  scenarios: {
    health_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '1m', target: 30 },
        { duration: '30s', target: 80 },
        { duration: '1m', target: 80 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const res = http.get(apiUrl('/api/health'));
  check(res, {
    'health 200': (r) => r.status === 200,
  });
}
