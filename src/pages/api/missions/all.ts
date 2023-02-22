
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

// Return all missions whose start date is in the future, up to 3 days in the future
// We want all those missions so we can store them on the client in case the connection is lost
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {

    const missions = await prisma.mission.findMany({
        where: {
            id: {
                gte: 1
            },
            start_date: {
                gte: new Date(),
                lte: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
            }
        },
    });

    // Cors
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).json(missions)
}

