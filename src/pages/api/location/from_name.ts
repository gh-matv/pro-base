// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { location_from_name } from '@/core/maps'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  loc: {
    lat: number,
    lng: number
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const loc = await location_from_name(req.query.name as string);
  res.status(200).json({ loc })
}
