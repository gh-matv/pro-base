
import {Driver as PrismaDriver, User as PrismaUser} from "@prisma/client"
import {Driver as GqlDriver} from "@/generated/graphql"

export default class Driver_Internal {

    constructor(
        public id: string,
        public email: string = "",
        public first_name: string = "",
        public last_name: string = "",
        public phone: string = "",
    ) {}

    static from_prisma(m: PrismaDriver, u: PrismaUser | null = null): Driver_Internal {        
        return new Driver_Internal(
            m.id.toString(),
            u?.email || "",
            m.firstname,
            m.lastname,
            m.phone
        )
    }

    to_gql(): GqlDriver {
        return {
            id: this.id,
            email: this.email,
            name: this.first_name + " " + this.last_name,
            phone: this.phone,
        }
    }
}
