import http from 'k6/http';
import { check } from 'k6';
import { apiUrl } from './lib/config.js';

export const options = {
  vus: 10,
  duration: '1m',
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
