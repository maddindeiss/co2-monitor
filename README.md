# co2monitor

## hardware
[TFA-Dostmann AirControl Mini CO2 Messgerät](http://www.amazon.de/dp/B00TH3OW4Q)

## example
```javascript
const Co2Monitor = require('./co2monitor');

let co2Monitor = new Co2Monitor();

co2Monitor.on('connected', (device) => {
    co2Monitor.startTransfer();
});

co2Monitor.on('error', (error) => {
    console.error(error);
})

co2Monitor.on('co2', (co2) => {
    console.log('co2: ' + co2);
})

co2Monitor.on('temp', (temp) => {
    console.log('temp: ' + temp);
})

co2Monitor.on('data', (data) => {
    console.log('data: ' + data);
})

co2Monitor.on('rawData', (rawData) => {
    console.log(rawData);
})

co2Monitor.connect();

```

## credits
based on code by [henryk ploetz](https://hackaday.io/project/5301-reverse-engineering-a-low-cost-usb-co-monitor/log/17909-all-your-base-are-belong-to-us)

## license
[MIT](http://opensource.org/licenses/MIT)
