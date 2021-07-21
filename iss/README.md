### Example Flux query

# Reading just the most recent data
```
import "experimental/csv"

csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/iss/iss-now-annotated.csv")
```

# Reading last 30 days of data
```
import "experimental/csv"

csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/iss/iss-historical-annotated.csv")
```