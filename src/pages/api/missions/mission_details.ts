
import type { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type Data = {
    error? : string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<any>
) {

    const id_str = req.query.id as string;
    if(!id_str) return res.status(400).json({ error: "No id provided" });

    const id = parseInt(id_str);
    if(isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const missions = await prisma.mission.findFirst({
        where: {
            id: id
        },
        include: {
            car: true,
            driver: true,
            passengers: true,
            folder: true,
            history: true,
            partner: true
        }
    });

    // Cors
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).json(missions)
}
