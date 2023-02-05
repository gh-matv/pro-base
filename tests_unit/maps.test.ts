import { location_from_name } from "../src/core/maps";

describe("location_from_name and cache", () => {

    it('should be able to query a new location', async () => {
        expect(await location_from_name("Aeroport Charles de Gaulle T1")).toEqual({
            lat: 49.0080713,
            lng: 2.5509443,
            name: "Aeroport Charles de Gaulle T1"
        });
    }); 
    
    it('should return the original name from one of the alternative names', async () => {
        expect(await location_from_name("cdg")).toEqual({
            lat: 49.0080713,
            lng: 2.5509443,
            name: "Aeroport Charles de Gaulle T1"
        });
    }); 
    
});

