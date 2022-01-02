# co2-monitor

Reads the CO2 level and temperature from the [TFA-Dostmann CO2-Monitor AIRCO2NTROL MINI](https://www.tfa-dostmann.de/produkt/co2-monitor-airco2ntrol-mini-31-5006/) via USB.

Just connect the sensor via USB and run the example script. There is no need to set up the sensor or USB port.

## Hardware
[TFA-Dostmann CO2-Monitor AIRCO2NTROL MINI 31.5006](https://www.tfa-dostmann.de/produkt/co2-monitor-airco2ntrol-mini-31-5006/)

## Install
``npm install co2-monitor``

## Example
```javascript
const Co2Monitor = require('co2-monitor');

let co2Monitor = new Co2Monitor();

co2Monitor.on('connected', (device) => {
  co2Monitor.startTransfer();

  console.log('Co2Monitor connected');
});

co2Monitor.on('disconnected', () => {
  console.log('Co2Monitor disconnected');
});

co2Monitor.on('error', (error) => {
  console.error(error);

  co2Monitor.disconnect(() => {
    process.exit(1);
  });
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

## Credits
based on code by [henryk ploetz](https://hackaday.io/project/5301-reverse-engineering-a-low-cost-usb-co-monitor/log/17909-all-your-base-are-belong-to-us)

## License
[MIT](http://opensource.org/licenses/MIT)
