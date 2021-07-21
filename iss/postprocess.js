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
const issJSON = await readJSON('./iss/iss-now.json')

let point = {
    tags: {},
    fields: {},
    measurement: "",
    timestamp: 0
}

point.measurement = "iss"
point.timestamp = issJSON.timestamp * 1000000000

point.fields.lon = parseFloat(issJSON.iss_position.longitude)
point.fields.lat = parseFloat(issJSON.iss_position.latitude)
    
// Tags
point.tags.type = "satellite"
point.tags.name = "iss"
point.tags.source = "http://api.open-notify.org/iss-now.json"

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

const newFilename = `./iss/iss-now.lp` // name of a new file to be saved
await writeTXT(newFilename, lp) // create a new JSON file with just the Bitcoin price