### Example Flux query

```
import "experimental/csv"
csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/gov/noaa/ndbc/latest-observations-annotated.csv")
  |> filter(fn: (r) => r._field == "dewpoint_temp_degc")
```