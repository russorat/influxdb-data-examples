[![fetch-data](https://github.com/russorat/influxdb-data-examples/actions/workflows/flat-data.yml/badge.svg)](https://github.com/russorat/influxdb-data-examples/actions/workflows/flat-data.yml)


This repo contains a set of data files which can be imported into any InfluxDB Cloud account with the `csv.from` functions.

Examples are:

```
import "experimental/csv"

csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/gov/usgs/earthquake/all_week-annotated.csv")
  |> filter(fn: (r) => r._field == "lat" or r._field == "lon")
```

```
import "experimental/csv"
csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/gov/noaa/ndbc/latest-observations-annotated.csv")
  |> filter(fn: (r) => r._field == "dewpoint_temp_degc")
```

```
import "experimental/csv"
csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/com/coindesk/bitcoin/currentprice-annotated.csv")
```

```
import "experimental/csv"

csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/iss/iss-now-annotated.csv")
```