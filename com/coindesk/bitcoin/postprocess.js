// This can be a typescript file as well

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
import { readJSON } from 'https://deno.land/x/flat@0.0.10/src/json.ts'
import { writeTXT } from 'https://deno.land/x/flat@0.0.10/src/txt.ts'
import { parse } from 'https://deno.land/std/datetime/mod.ts'

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
const bitcoinJSON = await readJSON('./com/coindesk/bitcoin/currentprice.json')

let points = []

for (const [currency, priceData] of Object.entries(bitcoinJSON.bpi)) {
    let point = {
        tags: {},
        fields: {},
        measurement: "",
        timestamp: 0
    }
    let timestamp = parse(bitcoinJSON.time.updatedISO.split("+")[0], "yyyy-MM-ddTHH:mm:ss")
    point.timestamp = timestamp.getTime() * 1000000

    point.tags.crypto = bitcoinJSON.chartName.toLowerCase()
    point.tags.code = priceData.code
    point.tags.symbol = priceData.symbol
    point.tags.description = priceData.description

    point.fields.price = priceData.rate_float

    point.measurement = "coindesk"
    points.push(point)
}

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

const newFilename = `./com/coindesk/bitcoin/currentprice.lp`
await writeTXT(newFilename, lpLines.join('\n'))
