import http from 'k6/http';
import { check } from 'k6';
import { apiUrl } from './lib/config.js';

/**
 * Carga sostenida para detectar fugas o degradación lenta (ajusta `duration` y `vus`).
 */
export const options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus: 15,
      duration: '15m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get(apiUrl('/api/health'));
  check(res, {
    'health 200': (r) => r.status === 200,
  });
}
