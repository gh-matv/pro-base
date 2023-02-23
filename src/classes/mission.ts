import { Mission as PrismaMission, PrismaClient } from "@prisma/client"
import {
    Mission as GqlMission,
    MissionResolvers,
    QueryResolvers,
    QueryMissionsArgs,
    MutationUpdateMissionArgs,
    ContractorResolvers,
    Contractor,
} from "@/generated/graphql"

const prisma = new PrismaClient()

// This is the internal representation of a mission
// It is used to convert between the prisma representation and the graphql representation
// Prisma uses 
export default class Mission_Internal {

    constructor(
        public id: string,
        public start_date: Date,
        public end_date: Date | null
    ) { }

    static GqlResolvers : {Mission: MissionResolvers<any, GqlMission>, Contractor: ContractorResolvers<any, Contractor>} = {

        Contractor: {
            name: (parent: any, params, context, infos) => {
                console.log("Returning name", parent, context, infos)
                return "name"
            },
            email: (parent: any, params, context, infos) => {
                console.log("Returning email", parent, context, infos)
                context.xd = "test"
                return "email"
            },
            phone: (parent: any, params, context, infos) => {
                console.log("Returning phone", parent, context, infos)
                if((context.xd?.indexOf("test") ?? -1) > -1) {
                    return "phoneXC"
                }
                return "phone"
            }
        },

        Mission: {
            status: (parent: any) => 'active',
            contractor: (parent: any, b, c) => {
                return ({id: "1"});
            }
        }
    }

    static GqlQueries : QueryResolvers<any> = {
        // missions: async (_:any, params: {q: GqlMissionQuery}, context: any): Promise<GqlMission[]> => 
		// 	(await Mission_Internal.search_from_gql_query(params.q)).map(m => m.to_gql()),

        missions: async (_:any, params: QueryMissionsArgs, context: any) => 
            (await Mission_Internal.search_from_gql_query(params)).map(m => m.to_gql()),
    }

    static GqlMutations = {
        updateMission: async (_: any, params: MutationUpdateMissionArgs): Promise<GqlMission> => 
			(await Mission_Internal.update_from_gql_update(params)).to_gql(),
    }

    static from_prisma(m: PrismaMission): Mission_Internal {
        return new Mission_Internal(
            m.id.toString(),
            m.start_date,
            m.end_date
        )
    }

    static to_prisma(m: Mission_Internal): PrismaMission {
        return {
            id: parseInt(m.id),
            start_date: m.start_date,
            end_date: m.end_date,
            location_steps: [],
            partnerId: 0,
            carId: 0,
            driverId: 0,
            folderId: 0,
            operatorId: 0
        }
    }

    to_gql(): GqlMission {
        return {
            id: this.id,
            startDate:this.start_date.toUTCString(),
            endDate: this.end_date?.toUTCString() ?? "",
            status: "active"
        }
    }

    static from_gql(m: GqlMission): Mission_Internal {
        return new Mission_Internal(
            m.id,
            new Date(m.startDate),
            m.endDate ? new Date(m.endDate) : null
        )
    }

    static async update_from_gql_update(m: MutationUpdateMissionArgs): Promise<Mission_Internal> {
        
        const p = await prisma.mission.update({
            where: { id: parseInt(m.id) },
            data: {
                start_date: m.startDate ? new Date(m.startDate) : undefined,
                end_date: m.endDate ? new Date(m.endDate) : undefined,
            }
        });

        console.log("Updated mission: " + JSON.stringify(p));

        return Mission_Internal.from_prisma(p);
    }

    static async search_from_gql_query(params: QueryMissionsArgs): Promise<Mission_Internal[]> {

        const missions = await prisma.mission.findMany({
            where: {
                id: params.id ? { gte: parseInt(params.id) } : undefined,
                start_date: params.date_earlier_than ? { lte: new Date(params.date_earlier_than) } : undefined,
                end_date: params.date_later_than ? { gte: new Date(params.date_later_than) } : undefined,
            }
        }) ?? [];

        return missions.map(m => Mission_Internal.from_prisma(m));
    }
    
}
