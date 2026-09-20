// Serves a web export with the security headers Vercel applies (read from vercel.json), so a mistake
// in the Content-Security-Policy shows up on this machine instead of after a deploy.
//
//   node scripts/preview.mjs [directory] [port]
//
// The API's address (EXPO_PUBLIC_API_URL) is added to `connect-src`, since production allows only
// the Railway domain.
import { readFileSync } from 'node:fs';
import http from 'node:http';

import handler from 'serve-handler';

const directory = process.argv[2] ?? 'dist';
const port = Number(process.argv[3] ?? 3000);
const apiOrigin = new URL(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').origin;
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

// Vercel writes wildcards as `(.*)`; serve-handler uses globs.
const glob = (source) => source.replace(/^\//, '').replace('(.*)', '**');

const headers = vercel.headers.map(({ source, headers: list }) => ({
  source: glob(source),
  headers: list.map(({ key, value }) => ({
    key,
    value:
      key === 'Content-Security-Policy'
        ? value.replace("connect-src 'self'", `connect-src 'self' ${apiOrigin}`)
        : value,
  })),
}));

const server = http.createServer((request, response) =>
  handler(request, response, {
    public: directory,
    rewrites: [{ source: '**', destination: '/index.html' }],
    headers,
  }),
);

server.listen(port, () => {
  console.log(`Serving ${directory} on http://localhost:${port} (API ${apiOrigin})`);
});
