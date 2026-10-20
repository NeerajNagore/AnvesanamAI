import type { VercelRequest, VercelResponse } from "./_lib/types";
import { setCorsHeaders } from "./_lib/config";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;
  return res.status(200).json({ ok: true });
}
