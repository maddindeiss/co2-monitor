# co2-monitor

Reads CO2, temperature and humidity from [TFA-Dostmann](https://www.tfa-dostmann.de/en/produkte/co2-measuring-instruments/) CO2-Monitor devices via USB.

Just connect the sensor via USB and run the example script. There is no need to set up the sensor or USB port.

## Supported Hardware
[TFA-Dostmann CO2-Monitor AIRCO2NTROL MINI 31.5006](https://www.tfa-dostmann.de/en/product/co2-monitor-airco2ntrol-mini-31-5006/)

[TFA-Dostmann CO2-Monitor AIRCO2NTROL COACH 31.5009](https://www.tfa-dostmann.de/en/product/co2-monitor-airco2ntrol-coach-31-5009/)

## Install
``npm install co2-monitor``

## Example
```javascript
const Co2Monitor = require('co2-monitor');

let co2Monitor = new Co2Monitor();

co2Monitor.on('connected', () => {
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
  console.log('co2: ' + co2.toString());
})

co2Monitor.on('humidity', (humidity) => {
  console.log('humidity: ' + humidity.toString());
})

co2Monitor.on('temperature', (temperature) => {
  console.log('temperature: ' + temperature.toString());
})

co2Monitor.on('data', (data) => {
  console.log('data: ' + data.toString());
})

co2Monitor.connect((error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  co2Monitor.startTransfer((error) => {
    if (error) {
      console.error(error);
    }
  });
});
```

## Events
### Temperature
``temperature`` event which is triggered on an update of temperature.

The event result is an object with the following structure:
```json
{
  "value": 23.73,
  "type": "float",
  "unit": "degree celsius",
  "symbol": "°C"
}
```

### Co2
``co2`` event which is triggered on an update of Co2.

The event result is an object with the following structure:
```json
{
  "value": 1744,
  "type": "int",
  "unit": "parts per million",
  "symbol": "ppm"
}
```

### Humidity
``humidity`` event which is triggered on an update of relative humidity.
> Only the AIRCO2NTROL COACH supports humidity data. The AIRCO2NTROL MINI will report humidity data with 0.

The event result is an object with the following structure:
```json
{
  "value": 40.75,
  "type": "float",
  "unit": "relative humidity",
  "symbol": "% rh"
}
```

### Data
``data`` event which is triggered on updates of humidity, temperature or co2.

The event result is an object with the following structure:
```json
{
  "co2": {
    "value": 1744,
    "type": "int",
    "unit": "parts per million",
    "symbol": "ppm"
  },
  "temperature": {
    "value": 23.73,
    "type": "float",
    "unit": "degree celsius",
    "symbol": "°C"
  },
  "humidity": {
    "value": 40.75,
    "type": "float",
    "unit": "relative humidity",
    "symbol": "% rh"
  }
}
```

## Credits
based on code by [henryk ploetz](https://hackaday.io/project/5301-reverse-engineering-a-low-cost-usb-co-monitor/log/17909-all-your-base-are-belong-to-us)

## License
[MIT](http://opensource.org/licenses/MIT)
