import http from 'k6/http';
import { check } from 'k6';
import { apiUrl } from './lib/config.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  const res = http.get(apiUrl('/api/health'));
  check(res, {
    'health status 200': (r) => r.status === 200,
  });
}
