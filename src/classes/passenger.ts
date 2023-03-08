import { Passenger, PassengerResolvers, QueryPassengerArgs, QueryPassengersArgs, QueryResolvers } from "@/generated/graphql";
import { Passenger as PrismaPassenger, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export default class Passenger_Internal {
    constructor(
        public id: number,
        public name: string,
        public phone: string,
        public informations: string,

    ) {}

    static GqlResolvers : {Passenger: PassengerResolvers<any, Passenger>} = {
        Passenger: {
            name: (_parent: any, _params, _context, _infos) => {
                return "name"
            },
        }
    }

    static GqlQueries : {Query: QueryResolvers<any, any>} = {
        Query: {
            passengers: async (_parent: any, _params: QueryPassengersArgs, _context, _infos) => {
                const passengers = await prisma.passenger.findMany()
                return passengers.map(e => Passenger_Internal.from_prisma(e).to_gql())
            },
            passenger: async (_parent: any, params: QueryPassengerArgs, _context, _infos) => {
                const passenger = await prisma.passenger.findUnique({
                    where: {
                        id: parseInt(params.id)
                    }
                })
                if(passenger === null) {
                    return null
                }
                return Passenger_Internal.from_prisma(passenger).to_gql()
            }
        }
    }

    static from_prisma(passenger: PrismaPassenger) {
        return new Passenger_Internal(
            passenger.id,
            passenger.name,
            passenger.phone,
            passenger.informations,
        )
    }

    to_gql() : Passenger {
        return {
            id: this.id.toString(),
            name: this.name,
            phone: this.phone,
            informations: this.informations,
        }
    }

}