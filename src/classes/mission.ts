import { Driver as PrismaDriver, Mission as PrismaMission, User as PrismaUser, Passenger as PrismaPassenger, PrismaClient } from "@prisma/client"
import {
    Mission as GqlMission,
    Driver as GqlDriver,
    MissionResolvers,
    QueryResolvers,
    QueryMissionsArgs,
    MutationUpdateMissionArgs,
    ContractorResolvers,
    Contractor,
    Mission,
} from "@/generated/graphql"
import Driver_Internal from "./driver"
import Passenger_Internal from "./passenger"

const prisma = new PrismaClient()

// This is the internal representation of a mission
// It is used to convert between the prisma representation and the graphql representation
// Prisma uses 
export default class Mission_Internal {

    constructor(
        public id: string,
        public start_date: Date,
        public end_date: Date | null,

        public type: string = "TA",
        public driver: Driver_Internal | null = null,
        public passengers: Passenger_Internal[] = [],

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
                    return "phone" + /* random number */ Math.floor(Math.random() * 1000)
                }
                return "phone"
            }
        },

        Mission: {
            status: (parent: any) => 'active',
            contractor: (parent: Mission, b, c) => {
                return ({id: parent.contractor?.id || "0"});
            },
            locationSteps: async (parent: Mission, params, context, infos) => {
                console.log("Returning locationSteps", parent, context, infos)
                return await prisma.missionLocationStep.findMany({
                    where: {
                        missionId: parseInt(parent.id)
                    },
                    select: {
                        location: true,
                }}).then(steps => steps.map(s => s.location))
            }
        }
    }

    static GqlQueries : QueryResolvers<any> = {
        // missions: async (_:any, params: {q: GqlMissionQuery}, context: any): Promise<GqlMission[]> => 
		// 	(await Mission_Internal.search_from_gql_query(params.q)).map(m => m.to_gql()),

        missions: async (_:any, params: QueryMissionsArgs, context: any) => 
            (await Mission_Internal.search_from_gql_query(params)).map(m => m.to_gql()),
        allIncomingMissions: async (_:any, params: QueryMissionsArgs, context: any) =>
            ((await prisma.mission.findMany({
                where: {
                    OR: [
                        { start_date: { gte: new Date() } },
                        { end_date: { gte: new Date() } },
                    ]
                },
                include: {
                    location_steps: true,
                    car: true,
                    driver: {
                        include: {
                            user: true,
                        }
                    },
                    partner: true,
                    passengers: true,
                }
            }).then(ms => ms.map(m => Mission_Internal.from_prisma(m)))).map(m => m.to_gql())),
    }

    static GqlMutations = {
        updateMission: async (_: any, params: MutationUpdateMissionArgs): Promise<GqlMission> => 
			(await Mission_Internal.update_from_gql_update(params)).to_gql(),
    }

    static from_prisma(
        m: PrismaMission
            & (({driver?: PrismaDriver & ({user?: PrismaUser | null} | null)}) | null) // Can include "driver" that could include "user" but doesnt have to.
            & ({passengers?: PrismaPassenger[]} | null | undefined) // Can include "passengers"
            ) : Mission_Internal
    {
        return new Mission_Internal(
            m.id.toString(),
            m.start_date,
            m.end_date,
            m.type,
            m.driver ? Driver_Internal.from_prisma(m.driver, m?.driver?.user) : null,
            m.passengers ? m.passengers.map(p => Passenger_Internal.from_prisma(p)) : [],
        )
    }

    static to_prisma(m: Mission_Internal): PrismaMission {
        return {
            id: parseInt(m.id),
            start_date: m.start_date,
            end_date: m.end_date,
            partnerId: 0,
            carId: 0,
            driverId: 0,
            folderId: 0,
            operatorId: 0,
            type: m.type,
        }
    }

    to_gql(): GqlMission {
        return {
            id: this.id,
            startDate:this.start_date.toUTCString(),
            endDate: this.end_date?.toUTCString() ?? "",
            type: this.type,
            status: "active",
            driver: this.driver?.to_gql() ?? null,
            passengers: this.passengers.map(p => p.to_gql()),
        }
    }

    static from_gql(m: GqlMission): Mission_Internal {
        return new Mission_Internal(
            m.id,
            new Date(m.startDate),
            m.endDate ? new Date(m.endDate) : null,
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
                id: params.id ? parseInt(params.id) : undefined,
                start_date: params.date_earlier_than ? { lte: new Date(params.date_earlier_than) } : undefined,
                end_date: params.date_later_than ? { gte: new Date(params.date_later_than) } : undefined,
            }
        }) ?? [];

        return missions.map(m => Mission_Internal.from_prisma(m));
    }
    
}
