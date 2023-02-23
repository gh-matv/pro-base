
import { ApolloServer, BaseContext } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

import fs from 'fs';
const { readFileSync } = fs;

import { Location, QueryLocationArgs, Resolvers } from '@/generated/graphql';
import Mission_Internal from '@/classes/mission';
import { location_from_name } from '@/core/maps';

const resolvers : Resolvers = {

	// We can override some fields of the generated type definitions
	...Mission_Internal.GqlResolvers,

	Query: {
		...Mission_Internal.GqlQueries,

		location: async (_:any, param: QueryLocationArgs): Promise<Location> => location_from_name(param.name),
	},

	Mutation: {
		...Mission_Internal.GqlMutations,
	}

};

const server = new ApolloServer<BaseContext>({
	resolvers,
	typeDefs: readFileSync('./src/pages/api/schema.graphql', 'utf8')
});

export default startServerAndCreateNextHandler(server);
