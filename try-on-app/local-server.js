import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import tryonHandler from './api/tryon.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Wrap the Vercel handler in an Express handler
app.post('/api/tryon', async (req, res) => {
  try {
    await tryonHandler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error from local proxy' });
  }
});

app.listen(port, () => {
  console.log(`Local API server listening at http://localhost:${port}`);
});
