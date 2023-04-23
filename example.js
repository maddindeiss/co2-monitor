const Co2Monitor = require('./co2-monitor');

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
