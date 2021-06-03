“Powered by CoinDesk” - https://www.coindesk.com/price/bitcoin

### Example Flux query

```
import "experimental/csv"
csv.from(url: "https://raw.githubusercontent.com/russorat/influxdb-data-examples/master/com/coindesk/bitcoin/currentprice-annotated.csv")
```