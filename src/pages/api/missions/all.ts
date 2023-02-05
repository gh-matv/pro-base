
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type Data = {
    loc: {
        lat: number,
        lng: number
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {

    const missions = await prisma.mission.findMany({
        where: {
            id: {
                gte: 1
            }
        },
    });

    // Cors
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).json(missions)
}

