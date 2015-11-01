# co2monitor

## hardware
[TFA-Dostmann AirControl Mini CO2 Messgerät](http://www.amazon.de/dp/B00TH3OW4Q)

## example
```javascript
var co2Monitor 	= require('./co2monitor.js');

co2Monitor.data().on('connected', function() {
    co2Monitor.startTransfer();
})

co2Monitor.data().on('co2', function(data) {
    console.log("co2 " + data);
})

co2Monitor.data().on('temp', function(data) {
    console.log("temp " + data);
})

co2Monitor.connect();

```

## credits
based on code by [henryk ploetz](https://hackaday.io/project/5301-reverse-engineering-a-low-cost-usb-co-monitor/log/17909-all-your-base-are-belong-to-us)

## license
[MIT](http://opensource.org/licenses/MIT)
