
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';

import fs from 'fs';
const { readFileSync } = fs;

import { PrismaClient } from '@prisma/client'
import { location_from_name } from '@/core/maps';
import { Location, Mission, MissionQuery, MissionUpdate } from '@/generated/graphql';
const prisma = new PrismaClient()

const resolvers = {

	// We can override some fields of the generated type definitions
	Mission: {
		status: () => 'active',
	},

	Query: {

		mission: async (_: any, { id }: {id:string}) => await prisma.mission.findUnique({ where: { id: parseInt(id) } }),
		missions: async (_:any, params: {q: MissionQuery}) => {
			const { q } = params;
			return await prisma.mission.findMany({
				where: {
					id: q.id ? { gte: parseInt(q.id) } : undefined,
					start_date: q.missions_from ? { gte: new Date(q.missions_from) } : undefined,
					end_date: q.missions_until ? { lte: new Date(q.missions_until) } : undefined,
				}
			})
		},

		location: async (_: any, { name }: {name:string}): Promise<Location> => location_from_name(name)

	},

	Mutation: {

		updateMission: async (_: any, params: {update: MissionUpdate}): Promise<Mission> => {
			const { update } = params;
			await prisma.mission.update({
				where: { id: parseInt(update.id) },
				data: {
					start_date: update.startDate ? new Date(update.startDate) : undefined,
					end_date: update.endDate ? new Date(update.endDate) : undefined,
				}
			})
			const v = await prisma.mission.findUnique({ where: { id: parseInt(update.id) } })
			return {
				id: ""+(v?.id??""),
				startDate: v?.start_date.toUTCString() ?? "",
				endDate: v?.end_date?.toUTCString() ?? "",
				status: "active"
			}
		}

	}

};

const server = new ApolloServer({
	resolvers,
	typeDefs: readFileSync('./src/pages/api/schema.graphql', 'utf8')
});

export default startServerAndCreateNextHandler(server);
