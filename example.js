const Co2Monitor = require('./co2-monitor');

let co2Monitor = new Co2Monitor();

co2Monitor.on('connected', (device) => {
  console.log('Co2Monitor connected');
});

co2Monitor.on('disconnected', () => {
  console.log('Co2Monitor disconnected');
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

  co2Monitor.disconnect(error => {
    if (error) {
      console.error(error);
    }
  });
})

co2Monitor.on('rawData', (rawData) => {
  console.log(rawData);
})

co2Monitor.connect(error => {
  if (error) {
    console.error(error);
  }

  co2Monitor.startTransfer();
});
