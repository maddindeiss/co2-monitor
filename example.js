const Co2Monitor = require('./co2-monitor');

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
