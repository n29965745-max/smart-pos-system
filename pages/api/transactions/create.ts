// This endpoint is deprecated — all transaction creation goes through /api/pos/checkout
// Kept as a stub to avoid 404s from any legacy clients
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: 'Gone — use /api/pos/checkout instead'
  });
}
