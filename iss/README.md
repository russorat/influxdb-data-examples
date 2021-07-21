### Example Flux query

```
import "experimental/csv"

csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/gov/usgs/earthquake/all_week-annotated.csv")
  |> filter(fn: (r) => r._field == "lat" or r._field == "lon")
```