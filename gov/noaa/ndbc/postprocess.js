// This can be a typescript file as well

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
import { writeJSON } from 'https://deno.land/x/flat@0.0.10/src/json.ts'
import { readTXT, writeTXT } from 'https://deno.land/x/flat@0.0.10/src/txt.ts' 
import { Parser } from 'https://deno.land/x/xmlparser@v0.2.0/mod.ts'

// Step 1: Read the downloaded_filename JSON
const observationsTxt = await readTXT('./gov/noaa/ndbc/latest-observations.txt')
const activeStations = await readTXT('./gov/noaa/ndbc/active-stations.xml')

const parser = new Parser({
    trimValues: true,
    reflectAttrs: false
  })
const root = parser.parse(activeStations.replaceAll(/\'/ig, '').replaceAll(/""/ig, '" "'))
const stationMap = {}
root.find(['stations', 'station']).forEach((node) => {
    if(node) {
        stationMap[node.getAttr('id').toUpperCase()] = {
            lat: parseFloat(node.getAttr('lat')),
            lon: parseFloat(node.getAttr('lon')),
            elev: parseFloat(node.getAttr('elev') || 0),
            name: node.getAttr('name'),
            owner: node.getAttr('owner'),
            pgm: node.getAttr('pgm'),
            type: node.getAttr('type'),
            met: node.getAttr('met'),
            currents: node.getAttr('currents'),
            waterquality: node.getAttr('waterquality'),
            dart: node.getAttr('dart'),
        }
    }
})

const re = /\s+/
const latest_columns = "wind_dir_degt,wind_speed_mps,gust_speed_mps,significant_wave_height_m,dominant_wave_period_sec,avg_wave_period_sec,wave_dir_degt,sea_level_pressure_hpa,air_temp_degc,sea_surface_temp_degc,dewpoint_temp_degc,station_visibility_nmi,pressure_tendency_hpa,water_level_ft".split(",")
const missing_data_list = "MM,999,9999.0,999.0,99.0,99.00".split(",")
let obsArray = observationsTxt.split('\n')
let jsonArray = obsArray.map(line => {
    if (!line.startsWith("#") && line.length != 0) {
        const readings = line.split(re)
        let ret = {
            station_id: readings.shift(),
            lat: parseFloat(readings.shift()),
            lon: parseFloat(readings.shift()),
        }
        let year = readings.shift()
        let month = readings.shift()
        let day = readings.shift()
        let hour = readings.shift()
        let minute = readings.shift()
        let date = year + "-" + month + "-" + day + "T" + hour + ":" + minute + "+0700" //2006-01-02T15:04

        ret["timestamp"] = new Date(date).valueOf() + "000000"

        readings.forEach((value, index) => {
            if (!missing_data_list.includes(value)) {
                ret[latest_columns[index]] = parseFloat(value)
            }
        })
        if(stationMap[ret.station_id]) {
            for (const [key, value] of Object.entries(stationMap[ret.station_id])) {
                if(key != 'lat' && key != 'lon') {
                    ret["station_"+key] = value
                }
            }
        }
        return ret
    }
})

jsonArray = jsonArray.filter(n => n)

// Step 3. Write a new JSON file with our filtered data
const newFilename = `./gov/noaa/ndbc/latest-observations.json` // name of a new file to be saved
await writeJSON(newFilename, jsonArray) // create a new JSON file with just the Bitcoin price

// can we generate a csv? let's try
let headers = [
    "wind_dir_degt",
    "wind_speed_mps",
    "gust_speed_mps",
    "significant_wave_height_m",
    "dominant_wave_period_sec",
    "avg_wave_period_sec",
    "wave_dir_degt",
    "sea_level_pressure_hpa",
    "air_temp_degc",
    "sea_surface_temp_degc",
    "dewpoint_temp_degc",
    "station_visibility_nmi",
    "pressure_tendency_hpa",
    "water_level_ft",
    "station_id",
    "lat",
    "lon",
    "station_elev",
    "station_name",
    "station_owner",
    "station_pgm",
    "station_type",
    "station_met",
    "station_currents",
    "station_waterquality",
    "station_dart",
    "timestamp"
]
let csvArray = [headers.join(',')]
jsonArray.forEach((obj, index) => {
    let arr = []
    let keys = Object.keys(obj)
    headers.forEach((header) => {
        if(keys.includes(header)) {
            if (header !== 'timestamp' && (typeof obj[header] === 'string' || obj[header] instanceof String)) {
                arr.push('"' + obj[header] + '"')
            } else {
                arr.push(obj[header])
            }
        } else {
            arr.push("")
        }
    })
    
    csvArray.push(arr.join(","))
})

await writeTXT('./gov/noaa/ndbc/latest-observations.csv', csvArray.join('\r\n')) 

// Optionally delete the original file
// await removeFile('./btc-price.json') // equivalent to removeFile('btc-price.json')