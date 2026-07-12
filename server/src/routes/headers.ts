import { Router } from 'express';
import {
  createHeader,
  deleteHeader,
  getHeader,
  listHeaders,
  updateHeader,
} from '../db.js';
import type { Entry, Header } from '../types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listHeaders());
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const header = getHeader(id);
  if (!header) {
    res.status(404).json({ error: 'Header not found' });
    return;
  }
  res.json(header);
});

router.post('/', (req, res) => {
  const { header, entries } = req.body as { header: Header; entries: Entry[] };
  if (!header || !Array.isArray(entries)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const created = createHeader(header, entries);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { header, entries } = req.body as { header: Header; entries: Entry[] };
  if (!header || !Array.isArray(entries)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  const updated = updateHeader(id, header, entries);
  if (!updated) {
    res.status(404).json({ error: 'Header not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const deleted = deleteHeader(id);
  if (!deleted) {
    res.status(404).json({ error: 'Header not found' });
    return;
  }
  res.status(204).send();
});

export default router;
