// This can be a typescript file as well

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
import { readJSON } from 'https://deno.land/x/flat@0.0.10/src/json.ts'
import { writeTXT } from 'https://deno.land/x/flat@0.0.10/src/txt.ts'
import { Point } from 'https://cdn.skypack.dev/@influxdata/influxdb-client-browser?dts'

// Step 1: Read the downloaded_filename JSON
const issJSON = await readJSON('./iss/iss-now.json')

let point = new Point("iss")
  .timestamp(issJSON.timestamp * 1000000000)
  .floatField('lon', issJSON.iss_position.longitude)
  .floatField('lat', issJSON.iss_position.latitude)
  .tag('type', 'satellite')
  .tag('name', 'iss')
  .tag('source', 'http://api.open-notify.org/iss-now.json')

const newFilename = `./iss/iss-now.lp` // name of a new file to be saved
await writeTXT(newFilename, point.toLineProtocol()) // create a new JSON file with just the Bitcoin price