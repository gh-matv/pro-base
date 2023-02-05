
# Maps requests and responses

## When selecting a location

The user can enter the name of a location in the search bar.

### If the location is known

If the location is known, it will be completed automatically.
If the location is known under another name, the field will be completed with the primary location name.

For example
> `cdg1` will be replaced with `Aeroport Charles de Gaulle T1`

This way, the user has more leeway to enter the location name, and it's easier to regroup the locations under a single name.

### If the location is unknown

If the location is unknown, the system will query google maps to find the location.

If the location is found very close to another known location, those locations will merge together, and the user will see the primary location name.

For example
> The user types `charles de gaulle t1`. Google Maps returns the location as inside the known `Aeroport Charles de Gaulle T1` location. Hence, the user will see `Aeroport Charles de Gaulle T1` in the search bar.

The boundaries of the locations will be requested automatically from google maps.

