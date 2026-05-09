// This route is deprecated — use /api/inventory/index.ts instead
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: 'This endpoint is deprecated. Use /api/inventory instead.' });
}
