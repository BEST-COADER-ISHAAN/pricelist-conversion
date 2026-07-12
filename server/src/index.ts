import cors from 'cors';
import express from 'express';
import './db.js';
import headersRouter from './routes/headers.js';
import exportRouter from './routes/export.js';
import { parseProductNames } from './parseProductNames.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/parse-names', (req, res) => {
  const { input } = req.body as { input?: string };
  if (typeof input !== 'string') {
    res.status(400).json({ error: 'input must be a string' });
    return;
  }
  res.json({ products: parseProductNames(input) });
});

app.use('/api/headers', headersRouter);
app.use('/api/export', exportRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
