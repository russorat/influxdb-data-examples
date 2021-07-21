// This can be a typescript file as well

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
import { readJSON } from 'https://deno.land/x/flat@0.0.10/src/json.ts'
import { writeTXT } from 'https://deno.land/x/flat@0.0.10/src/txt.ts'

function createEscaper(characters, replacements) {
    return function (value) {
        var retVal = '';
        var from = 0;
        var i = 0;
        while (i < value.length) {
            var found = characters.indexOf(value[i]);
            if (found >= 0) {
                retVal += value.substring(from, i);
                retVal += replacements[found];
                from = i + 1;
            }
            i++;
        }
        if (from == 0) {
            return value;
        }
        else if (from < value.length) {
            retVal += value.substring(from, value.length);
        }
        return retVal;
    };
}
function createQuotedEscaper(characters, replacements) {
    var escaper = createEscaper(characters, replacements);
    return function (value) { return '"' + escaper(value) + '"'; };
}
/**
 * Provides functions escape specific parts in InfluxDB line protocol.
 */
var escape = {
    /**
     * Measurement escapes measurement names.
     */
    measurement: createEscaper(', \n\r\t', ['\\,', '\\ ', '\\n', '\\r', '\\t']),
    /**
     * Quoted escapes quoted values, such as database names.
     */
    quoted: createQuotedEscaper('"\\', ['\\"', '\\\\']),
    /**
     * TagEscaper escapes tag keys, tag values, and field keys.
     */
    tag: createEscaper(', =\n\r\t', ['\\,', '\\ ', '\\=', '\\n', '\\r', '\\t']),
};

// Step 1: Read the downloaded_filename JSON
const earthquakeJSON = await readJSON('./gov/usgs/earthquake/all_week.geojson')

//console.log(earthquakeJSON)
let points = []
earthquakeJSON.features.forEach((feature, index) => {
    let point = {
        tags: {},
        fields: {},
        measurement: "",
        timestamp: 0
    }
    point.timestamp = feature.properties.time * 1000000

    point.fields.lon = feature.geometry.coordinates[0]
    point.fields.lat = feature.geometry.coordinates[1]
    point.fields.depth = feature.geometry.coordinates[2]
    

    // Fields
    point.fields.mag = feature.properties.mag
    point.fields.place = feature.properties.place
    point.fields.url = feature.properties.url
    point.fields.detail = feature.properties.detail
    point.fields.felt = feature.properties.felt || 0
    point.fields.cdi = feature.properties.cdi || 0.0
    point.fields.mmi = feature.properties.mmi || 0.0
    point.fields.alert = feature.properties.alert
    point.fields.status = feature.properties.status
    point.fields.tsunami = feature.properties.tsunami
    point.fields.sig = feature.properties.sig || 0
    point.fields.ids = feature.properties.ids
    point.fields.sources = feature.properties.sources
    point.fields.types = feature.properties.types
    point.fields.nst = feature.properties.nst || 0
    point.fields.dmin = feature.properties.dmin || 0.0
    point.fields.rms = feature.properties.rms || 0.0
    point.fields.gap = feature.properties.gap || 0.0
    
    // Tags
    point.tags.net = feature.properties.net
    point.tags.code = feature.properties.code
    point.tags.magType = feature.properties.magType
    point.measurement = feature.properties.type
    point.tags.title = feature.properties.title
    point.tags.id = feature.id

    points.push(point)
})

let lpLines = []
points.forEach((point, index) => {
    let lp = escape.measurement(point.measurement)
    let fieldsLine = ""
    Object.keys(point.fields)
        .sort()
        .forEach(function (x) {
            if (x) {
                let val = point.fields[x];
                if(val) {
                    if (fieldsLine.length > 0) {
                        fieldsLine += ',';
                    }
                    if(typeof val === 'string') {
                        val = `"${val}"`
                    }
                    fieldsLine += escape.tag(x) + "=" + val;
                }
            }
        })
    let tagsLine = '';
    Object.keys(point.tags)
        .sort()
        .forEach(function (x) {
        if (x) {
            let val = point.tags[x];
            if (val) {
                tagsLine += ',';
                tagsLine += escape.tag(x) + "=" + escape.tag(val);
            }
        }
    });
    lp += tagsLine + " " + fieldsLine + (point.timestamp !== undefined ? ' ' + point.timestamp : '');
    lpLines.push(lp)
})

const newFilename = `./gov/usgs/earthquake/all_week.lp` // name of a new file to be saved
await writeTXT(newFilename, lpLines.join('\n')) // create a new JSON file with just the Bitcoin price


// // Step 3. Write a new JSON file with our filtered data
// const newFilename = `./gov/noaa/ndbc/latest-observations.json` // name of a new file to be saved
// await writeJSON(newFilename, jsonArray) // create a new JSON file with just the Bitcoin price

// // can we generate a csv? let's try
// let headers = [
//     "wind_dir_degt",
//     "wind_speed_mps",
//     "gust_speed_mps",
//     "significant_wave_height_m",
//     "dominant_wave_period_sec",
//     "avg_wave_period_sec",
//     "wave_dir_degt",
//     "sea_level_pressure_hpa",
//     "air_temp_degc",
//     "sea_surface_temp_degc",
//     "dewpoint_temp_degc",
//     "station_visibility_nmi",
//     "pressure_tendency_hpa",
//     "water_level_ft",
//     "station_id",
//     "lat",
//     "lon",
//     "station_elev",
//     "station_name",
//     "station_owner",
//     "station_pgm",
//     "station_type",
//     "station_met",
//     "station_currents",
//     "station_waterquality",
//     "station_dart",
//     "timestamp"
// ]
// let csvArray = [headers.join(',')]
// jsonArray.forEach((obj, index) => {
//     let arr = []
//     let keys = Object.keys(obj)
//     headers.forEach((header) => {
//         if(keys.includes(header)) {
//             if (header !== 'timestamp' && (typeof obj[header] === 'string' || obj[header] instanceof String)) {
//                 arr.push('"' + obj[header] + '"')
//             } else {
//                 arr.push(obj[header])
//             }
//         } else {
//             arr.push("")
//         }
//     })
    
//     csvArray.push(arr.join(","))
// })

// await writeTXT('./gov/noaa/ndbc/latest-observations.csv', csvArray.join('\r\n')) 

// // Optionally delete the original file
// // await removeFile('./btc-price.json') // equivalent to removeFile('btc-price.json')