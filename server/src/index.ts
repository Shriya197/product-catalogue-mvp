import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[server] API listening on http://localhost:${env.PORT}`);
});
