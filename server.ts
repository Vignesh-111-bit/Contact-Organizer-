import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as db from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Real-Time Multi-User Synchronization via Server-Sent Events (SSE)
  const sseClients = new Set<express.Response>();

  function broadcast(event: { type: string; [key: string]: any }) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // SSE Real-time stream endpoint
  app.get('/api/realtime', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Register active subscriber
    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'connected', clientsCount: sseClients.size })}\n\n`);

    // Keepalive ping every 25 seconds
    const interval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  });

  // 1. Get client contacts
  app.get(['/api/clients', '/api/contacts'], (req, res) => {
    try {
      const { search, department, status, favorite } = req.query;
      const clients = db.getClients({
        search: typeof search === 'string' ? search : undefined,
        department: typeof department === 'string' ? department : undefined,
        status: typeof status === 'string' ? status : undefined,
        favoriteOnly: favorite === 'true',
      });
      res.json({ success: true, count: clients.length, data: clients });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Create client contact
  app.post(['/api/clients', '/api/contacts'], (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Client name is required.' });
      }
      const client = db.createClient(req.body);
      broadcast({ type: 'client:created', client });
      res.status(201).json({ success: true, data: client });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Update client contact
  app.put(['/api/clients/:id', '/api/contacts/:id'], (req, res) => {
    try {
      const updated = db.updateClient(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Client contact not found' });
      }
      broadcast({ type: 'client:updated', client: updated });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Delete client contact
  app.delete(['/api/clients/:id', '/api/contacts/:id'], (req, res) => {
    try {
      const ok = db.deleteClient(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Client contact not found' });
      }
      broadcast({ type: 'client:deleted', id: req.params.id });
      res.json({ success: true, message: 'Client removed' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Toggle favorite / priority client
  app.post(['/api/clients/:id/favorite', '/api/contacts/:id/favorite'], (req, res) => {
    try {
      const updated = db.toggleFavorite(req.params.id);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Client contact not found' });
      }
      broadcast({ type: 'client:updated', client: updated });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Add client interaction note
  app.post(['/api/clients/:id/notes', '/api/contacts/:id/notes'], (req, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Note text cannot be empty' });
      }
      const updated = db.addNote(req.params.id, text);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Client contact not found' });
      }
      broadcast({ type: 'client:updated', client: updated });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Delete client note
  app.delete(['/api/clients/:id/notes/:noteId', '/api/contacts/:id/notes/:noteId'], (req, res) => {
    try {
      const updated = db.deleteNote(req.params.id, req.params.noteId);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Client contact not found' });
      }
      broadcast({ type: 'client:updated', client: updated });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Export CSV
  app.get(['/api/clients/export', '/api/contacts/export'], (req, res) => {
    try {
      const csv = db.exportCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="gen11-clients.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Clear all clients
  app.post(['/api/clients/clear', '/api/contacts/clear'], (req, res) => {
    try {
      db.clearClients();
      broadcast({ type: 'clients:cleared' });
      res.json({ success: true, message: 'All client contacts cleared' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Customizable Departments / Categories
  app.get('/api/departments', (req, res) => {
    try {
      const depts = db.readDepartments();
      res.json({ success: true, data: depts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/departments', (req, res) => {
    try {
      const { name, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Category name is required' });
      }
      const dept = db.createDepartment(name, color);
      broadcast({ type: 'category:created', department: dept });
      res.status(201).json({ success: true, data: dept });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/departments/:id', (req, res) => {
    try {
      const ok = db.deleteDepartment(req.params.id);
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      broadcast({ type: 'category:deleted', id: req.params.id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`gen11 client organizer server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
