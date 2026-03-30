# Pruebas de carga con k6

Scripts para medir capacidad y latencia de la API (Express + Redis + MySQL). Ejecuta los comandos **desde la raíz del repositorio** para que las rutas `load-tests/...` y `open()` resuelvan bien.

## Requisito: rate limiting

Con los límites por defecto (`express-rate-limit`: 100 req/min global y 5 req/min en `/api/auth`), una sola IP (k6) recibirá muchos **429** y no medirá la capacidad real del servidor.

Para pruebas de carga locales o staging, en el backend:

```bash
# backend/.env
RATE_LIMIT_ENABLED=false
```

No desactives esto en producción salvo una ventana de medición controlada y breve.

## Variables de entorno (k6)

| Variable | Descripción |
|----------|-------------|
| `BASE_URL` | Base de la API (default `http://localhost:3001`) |
| `TEST_EMAIL` / `TEST_PASSWORD` | Credenciales si no usas `users.json` (default: seed `admin@enarm.test` / `Admin12345678`) |
| `USERS_FILE` | Ruta a un JSON de credenciales (array de `{ email, password }`) |
| `VUS` | Solo `auth-read.js`: VUs deseadas (default `20`). El script **no usa más VUs que cuentas** en la lista: con 1 usuario solo corre **1 VU** (una sesión activa por usuario en Redis). |

## Instalación de k6

- macOS: `brew install k6`
- [Otras plataformas](https://grafana.com/docs/k6/latest/set-up/install-k6/)

## Ejecución

Con el backend y dependencias (MySQL, Redis) en marcha:

```bash
k6 run load-tests/smoke.js
k6 run load-tests/health.js
k6 run load-tests/stress.js
k6 run load-tests/soak.js
```

Con `BASE_URL` explícito:

```bash
BASE_URL=http://localhost:3001 k6 run load-tests/smoke.js
```

### Docker (sin instalar k6 en el host)

Desde la raíz del repo:

```bash
docker run --rm -i --network host -v "$PWD:/scripts" -w /scripts \
  -e BASE_URL=http://host.docker.internal:3001 \
  grafana/k6 run load-tests/smoke.js
```

En Linux, `host.docker.internal` puede requerir `--add-host=host.docker.internal:host-gateway`. Si usas `--network host`, `BASE_URL=http://localhost:3001` suele bastar.

## Scripts

| Script | Uso |
|--------|-----|
| `smoke.js` | 1 VU, 1 iteración: comprobación rápida de que `/api/health` responde |
| `health.js` | Carga moderada sobre `/api/health` (cadena API + Redis + DB) |
| `stress.js` | Rampa de VUs sobre `/api/health` para acercar el punto de saturación |
| `soak.js` | Carga constante prolongada (estabilidad) |
| `auth-read.js` | Login + `GET /api/specialties` y `GET /api/profile` con cookies |

## Un usuario seed vs varios usuarios (N sesiones)

- **Un solo usuario en BD** y muchas VUs en `auth-read.js`: cada VU hace login una vez; el servidor **revoca la sesión anterior** en Redis al volver a iniciar sesión con la misma cuenta. Varios logins concurrentes con la misma cuenta compiten y pueden provocar **401** en lecturas. Eso no refleja “N usuarios reales” con distintas cuentas.

- **Más fiel a N usuarios**: crea N cuentas en producción/staging, pon **N entradas** en `users.json` y opcionalmente `VUS=N`. El script limita automáticamente `vus` a `min(VUS, número de cuentas)` y avisa en consola si pedías más VUs que usuarios.

- **Solo throughput de lecturas con una sesión**: usa un login en `setup()` (o 1 VU) y mide solo `GET` autenticados; no mide “N usuarios simultáneos” con N identidades.

## Qué documentar como resultado

- Entorno: máquina, `NODE_ENV`, si `RATE_LIMIT_ENABLED` está desactivado, Node, Docker o no, recursos de MySQL/Redis.
- Salida de k6: RPS, `http_req_duration` p95/p99, tasa de `http_req_failed`, VUs máximos bajo SLA acordado.
- Formulación: *“Con [condiciones], el sistema mantuvo <X% errores y p95 < Y ms hasta Z VUs o W RPS”* — evita un único “soporta N usuarios” sin contexto.

## Credenciales de ejemplo

El seed crea `admin@enarm.test` / `Admin12345678` (ver `backend/prisma/seed.ts`). `users.json.example` muestra el mismo formato para listas de cuentas.
