import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  // Explicitly create the HTTP server
  const server = http.createServer(app);

  // Create Vite server in middleware mode
  // We bind hmr.server to our http server to prevent Vite from creating its own internal connection logic
  // which causes conflicts in LiteSpeed/Node environments.
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        server: server
      }
    },
    appType: 'custom'
  });

  // Use vite's connect instance as middleware.
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      );

      // 2. Apply Vite HTML transforms.
      template = await vite.transformIndexHtml(url, template);

      // 3. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  const port = process.env.PORT || 3000;
  
  // Listen on the explicitly created server instance
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();