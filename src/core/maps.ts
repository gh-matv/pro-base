import { Client, LatLngLiteral } from "@googlemaps/google-maps-services-js";
import { PrismaClient } from "@prisma/client";
import { distance } from "@turf/turf";

const client = new Client({});
const prisma = new PrismaClient();

const GOOGLE_API_KEY = "AIzaSyDy00hN3E5T624ncCFNvbzAqROGoXcpmuk";

/**
 * 
 * @param name 
 * @returns 
 */
export const location_from_name = async (name: string) => {

    // First check if the location is already in the database

    const location = await prisma.geoloc_cache.findFirst({
        where: {
            name: name
        }
    });

    if (location) {
        console.log("Location found in cache");
        return { lat: location.lat, lng: location.lng, name: location.name };
    }

    // Try to find with alternative names
    const location_alt = await prisma.geoloc_cache_alternative_names.findFirst({
        where: {
            name: name
        },
        include: {
            geoloc_cache: true
        }
    });

    if (location_alt) {
        console.log("Location found in cache with alternative name");
        return {
            lat: location_alt.geoloc_cache.lat,
            lng: location_alt.geoloc_cache.lng,
            name: location_alt.geoloc_cache.name
        };
    }

    // Not found in cache, try to find with Google API

    const google_api_result = await client.geocode({
        params: {
            address: name,
            key: GOOGLE_API_KEY,
        }
    });

    if (google_api_result.data.status !== "OK") {
        // throw new Error("Google API error: " + google_api_result.data.status);
        return {
            lat: 0,
            lng: 0,
            name: name
        }
    }

    if (google_api_result.data.results.length === 0) {
        throw new Error("Google API error");
    }

    // If the location is close enough to another location in the database
    // Add the alternative name to the database. For this, we first find the closest locatiosn...
    // 0.05 shift in lat and lng is about 5km

    const google_result = google_api_result.data.results[0];

    const locations = await prisma.geoloc_cache.findMany({
        where: {
            lat: {
                gte: google_result.geometry.location.lat - 0.1,
                lte: google_result.geometry.location.lat + 0.1
            },
            lng: {
                gte: google_result.geometry.location.lng - 0.1,
                lte: google_result.geometry.location.lng + 0.1,
            }
        }
    });

    console.log({ locations });

    // Check if the location is within the radius of another location in the database
    // If so, add the alternative name to the database
    // This is because not every location is the same radius, so we can't just check if the location is within the radius of the location we found

    for (let i = 0; i < locations.length; i++) {

        const location = locations[i];

        const pos_ne = { lat: location.geometry_bounds_ne_lat, lng: location.geometry_bounds_ne_lng };
        const pos_sw = { lat: location.geometry_bounds_sw_lat, lng: location.geometry_bounds_sw_lng };

        if (
            google_result.geometry.location.lat > pos_ne.lat
            || google_result.geometry.location.lat < pos_sw.lat
            || google_result.geometry.location.lng > pos_ne.lng
            || google_result.geometry.location.lng < pos_sw.lng
        ) {
            console.log("Location not inside bounds");
            continue;
        }

        console.log("Location found in cache with alternative name and correct location");

        await prisma.geoloc_cache_alternative_names.create({
            data: {
                name: name,
                geoloc_cache: {
                    connect: {
                        id: location.id
                    }
                }
            }
        });

        return {
            lat: location.lat,
            lng: location.lng,
            name: location.name
        };

    }

    console.log("add as new location")

    // If the location is not close enough to another location in the database
    // Add the location to the database

    console.log("Location not found in cache, adding to cache");
    const new_location = await prisma.geoloc_cache.create({
        data: {

            gmaps_id: google_result.place_id,

            name: name,
            type: google_result.types[0]?.toLowerCase() ?? "unknown",

            lat: google_result.geometry.location.lat,
            lng: google_result.geometry.location.lng,

            geometry_bounds_ne_lat: google_result.geometry.viewport?.northeast.lat ?? 0,
            geometry_bounds_ne_lng: google_result.geometry.viewport?.northeast.lng ?? 0,
            geometry_bounds_sw_lat: google_result.geometry.viewport?.southwest.lat ?? 0,
            geometry_bounds_sw_lng: google_result.geometry.viewport?.southwest.lng ?? 0,

            // radius: google_result.geometry.viewport ? distance(
            //     { type: "Point", coordinates: [google_result.geometry.viewport.northeast.lng, google_result.geometry.viewport.northeast.lat] },
            //     { type: "Point", coordinates: [google_result.geometry.viewport.southwest.lng, google_result.geometry.viewport.southwest.lat] },
            //     { units: "kilometers" }
            // ) / 2 : .1,
        }
    });


    return {
        lat: new_location.lat,
        lng: new_location.lng,
        name: new_location.name
    };
}
