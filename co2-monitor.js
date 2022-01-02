const os = require('os');
const usb = require('usb');

const EventEmitter = require('events').EventEmitter;

/**
 * @class Co2Monitor
 * @extends EventEmitter
 *
 * @fires Co2Monitor#data
 * @fires Co2Monitor#error
 * @fires Co2Monitor#co2
 * @fires Co2Monitor#temperature
 * @fires Co2Monitor#humidity
 *
 * @typedef {"connected", "disconnected", "co2", "temperature", "humidity", "data", "error"} eventsDef
 */
class Co2Monitor extends EventEmitter {
  constructor() {
    super();

    this.co2Device = null;
    this.co2Interface = null;
    this.co2Endpoint = null;

    this.idVendor = 0x04D9;
    this.idProduct = 0xA052;

    this.response = new Response();

    this.buf = Buffer.from([
      0xc4, 0xc6, 0xc0, 0x92, 0x40, 0x23, 0xdc, 0x96
    ]);

    process.on('SIGINT', () => {
      this.disconnect(function (cb) {
        if (cb) process.exit();
      });
    });
  }

  /**
   * @param {eventsDef} args
   */
  on(...args) {
    super.on(...args);
  }

  connect(callback) {
    this.co2Device = usb.findByIds(this.idVendor, this.idProduct);

    if (!this.co2Device) {
      let error = new Error('Device not found');
      this.emitError(error);
      return callback(error);
    }

    try {
      this.co2Device.open();

      this.co2Interface = this.co2Device.interfaces[0];

      if (!this.co2Interface) {
        let error = new Error('Interface not found');
        this.emitError(error);
        return callback(error);
      }

      if (os.platform() === 'linux') {
        if (this.co2Interface.isKernelDriverActive()) {
          this.co2Interface.detachKernelDriver();
        }
      }

      let emitError = this.emitError.bind(this);
      this.co2Device.controlTransfer(0x21, 0x09, 0x0300, 0x00, this.buf, function (error, data) {
        if (error) {
          emitError(error);
          return callback(error);
        }
      });

      this.co2Interface.claim();
      this.co2Endpoint = this.co2Interface.endpoints[0];

      /**
       * @event Co2Monitor#connected
       */
      this.emit("connected", this.co2Device);
      return callback();

    } catch (error) {
      this.emitError(error);
      return callback(error);
    }
  }

  disconnect(callback) {
    try {
      if (!this.co2Endpoint) {
        console.error("No endpoint to close");
        return callback();
      }

      this.co2Endpoint.stopPoll(() => {

        if (os.platform() === 'linux') {
          this.co2Interface.attachKernelDriver();
        }

        this.co2Interface.release(true, (error) => {
          if (error) {
            this.emitError(error);
          }

          this.co2Device.close();
          /**
           * @event Co2Monitor#disconnected
           */
          this.emit("disconnected");
          return callback();
        });

      });
    } catch (error) {
      this.emitError(error);
      return callback(error);
    }
  }

  startTransfer(callback) {
    this.co2Endpoint.transfer(8, (error) => {
      if (error) {
        this.emitError(error);
        return callback(error);
      }

      this.co2Endpoint.startPoll(8, 64);

      this.co2Endpoint.on('data', (data) => {

        // Skip decryption for newer CO2 sensors.
        if (data[4] !== 0x0d) {
          data = Co2Monitor._decrypt(this.buf, data);
        }

        let op = data[0];
        let value = data[1] << 8 | data[2];

        switch (op) {
          case 0x41:
            // Humidity
            this.response.humidity = new HumidityResponse(value);

            /**
             * @event Co2Monitor#humidity
             * @type {HumidityResponse}
             */
            this.emit("humidity", this.response.humidity);
            break;
          case 0x42:
            // Temperature
            this.response.temperature = new TemperatureResponse(value);

            /**
             * @event Co2Monitor#temperature
             * @type {TemperatureResponse}
             */
            this.emit("temperature", this.response.temperature);
            break;
          case 0x50:
            // Co2
            this.response.co2 = new Co2Response(value);

            /**
             * @event Co2Monitor#co2
             * @type {Co2Response}
             */
            this.emit("co2", this.response.co2);
            break;
          default:
            break;
        }

        if (this.response.co2 !== null && this.response.temperature !== null && this.response.humidity !== null) {

          /**
           * @event Co2Monitor#data
           * @type {Response}
           */
          this.emit("data", this.response);
        }
      })

      this.co2Endpoint.on("error", (error) => {
        this.emitError(error);
        return callback(error);
      });

      return callback();
    });
  }

  /**
   * Get current temperature in Celsius
   * @returns {TemperatureResponse}
   */
  get temperature() {
    return this.response.temperature;
  }

  /**
   * Get current co2 level
   * @returns {Co2Response}
   */
  get co2() {
    return this.response.co2;
  }

  /**
   * Get current humidity level
   * @returns {HumidityResponse}
   */
  get humidity() {
    return this.response.humidity;
  }

  static _decrypt(buf, data) {
    const cstate = [0x48, 0x74, 0x65, 0x6D, 0x70, 0x39, 0x39, 0x65];
    const shuffle = [2, 4, 0, 7, 1, 6, 5, 3];
    let i;

    let phase1 = [];
    for (i = 0; i < shuffle.length; i++) {
      phase1[shuffle[i]] = data[i];
    }

    let phase2 = [];
    for (i = 0; i < cstate.length; i++) {
      phase2[i] = phase1[i] ^ buf[i];
    }

    let phase3 = [];
    for (i = 0; i < cstate.length; i++) {
      phase3[i] = ((phase2[i] >> 3) | (phase2[(i - 1 + 8) % 8] << 5)) & 0xff;
    }

    let out = [];
    for (i = 0; i < cstate.length; i++) {
      let ctmp = ((cstate[i] >> 4) | (cstate[i] << 4)) & 0xff;
      out[i] = ((0x100 + phase3[i] - ctmp) & 0xff);
    }

    return out;
  }

  emitError(error) {
    /**
     * @event Co2Monitor#error
     * @type {Error}
     */
    this.emit("error", error);
  }
}

class Response {
  constructor() {
    this.co2 = null;
    this.temperature = null;
    this.humidity = null;
  }

  toString() {
    return JSON.stringify(this);
  }
}

class TemperatureResponse {
  constructor(temperature) {
    this.value = parseFloat((temperature / 16.0 - 273.15).toFixed(2));
    this.type = "float";
    this.unit = "°C";
  }

  toString() {
    return JSON.stringify(this);
  }
}

class HumidityResponse {
  constructor(humidity) {
    this.value = parseFloat((humidity / 100).toFixed(2));
    this.type = "float";
    this.unit = "% rh";
  }

  toString() {
    return JSON.stringify(this);
  }
}

class Co2Response {
  constructor(co2) {
    this.value = co2;
    this.type = "int";
    this.unit = "ppm";
  }

  toString() {
    return JSON.stringify(this);
  }
}

module.exports = Co2Monitor;
