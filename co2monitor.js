var buffer 	= require('buffer');
var usb 	= require('usb');

var EventEmitter = require('events').EventEmitter;

function Co2Monitor() {
	var co2Device    = null;
	var co2Interface = null;
	var co2Endpoint  = null;

	var idVendor  = 0x04D9;
	var idProduct = 0xA052;

	var buf = new Buffer(8);
	buf.writeUInt8(0xc4,0);
	buf.writeUInt8(0xc6,1);
	buf.writeUInt8(0xc0,2);
	buf.writeUInt8(0x92,3);
	buf.writeUInt8(0x40,4);
	buf.writeUInt8(0x23,5);
	buf.writeUInt8(0xdc,6);
	buf.writeUInt8(0x96,7);

	var emitter = new EventEmitter();

	function setVidPid(vid, pid) {
		idVendor = vid;
		idProduct = pid;
	}

	function getVidPid() {
		return {vid: idVendor, pid: idProduct};
	}

	function connectToDevice() {
		co2Device = usb.findByIds(idVendor, idProduct);

		if(!co2Device) {
			throw new Error('Device not found!');
		}

		try {
			co2Device.open();

			co2Device.controlTransfer(0x21,0x09,0x0300,0x00,buf, function(err,data) {
				if(err) console.log("Error in opening control transfer:" + err);
			});

			if(!co2Device.interfaces[0]) {
				throw new Error('Interface not found on Device!');
			}
			else {
				co2Interface = co2Device.interfaces[0];
				co2Interface.claim();

				co2Endpoint = co2Interface.endpoints[0];

				emitter.emit("connected");
			}
		} catch (e) {
			throw new Error('Error while connecting to device! ' + e);
		}
	}

	function startTransfer() {
		_startPoll(co2Endpoint, function(cb) {
			
			if(cb) {
				co2Endpoint.on('data', function(data) {

					emitter.emit("rawData", data);

					var decrypted = _decrypt(buf, data);
					var values = {};

					var op = decrypted[0];
					values[op] = decrypted[1] << 8 | decrypted[2];

					if (values[80]) {
						var co2 = values[80];
						emitter.emit("co2", co2);
					}

					if (values[66]) {
						var tmp = (values[66]/16.0-273.15).toFixed(3);
						emitter.emit("temp", tmp);
					}

					if (values[68]) {
						var RH = (values[68]/100);
					}
				});

				co2Endpoint.on("error", function(err) {
					console.log("Endpoint error: " + err);
					emitter.emit("error", err);
				});

				co2Endpoint.on("end",function() {
					console.log("Endpoint stream ending");
				});
			}
			else {
				throw new Error('Error on polling the endpoint!');
			}
		});
	}

	function getEmitter() {
		return emitter;
	}

	function _startPoll(endpoint, callback) {
		try{
			endpoint.transfer(8, function(err, data) {
				if(err) throw new Error('Endpoint transfer error: ' + err);
			});

			endpoint.startPoll(8, 64);

			callback(true);

		} catch(e) {
			callback(false);
		}
	}


	function _decrypt(buf, data) {
		var cstate = [0x48,  0x74,  0x65,  0x6D,  0x70,  0x39,  0x39,  0x65];
		var shuffle = [2, 4, 0, 7, 1, 6, 5, 3];
		var i;

		var phase1 = [];
		for(i = 0; i < shuffle.length; i++) {
			phase1[shuffle[i]] = data[i];
		}

		var phase2 = [];
		for(i = 0; i < 8; i++) {
			phase2[i] = phase1[i] ^ buf[i];
		}

		var phase3 = [];
		for(i = 0; i < 8; i++) {
			phase3[i] =  ((phase2[i] >> 3) | (phase2[ (i-1+8)%8 ] << 5) ) & 0xff;
		}

		var ctmp = [];
		for(i = 0; i < 8; i++) {
			ctmp[i] = ( (cstate[i] >> 4) | (cstate[i]<<4) ) & 0xff;
		}

		var out = [];
		for(i = 0; i < 8 ; i++) {
			out[i] = ((0x100 + phase3[i] - ctmp[i]) & 0xff);
		}

		return out;
	}

	process.on('SIGINT', function() {
		console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );

		try {
			co2Endpoint.stopPoll();
		}
		catch(e) {
			console.log("Some issues stopping stream");
		}

		co2Interface.release(function(err) {
			console.log("Trying to release interface: " + err);
		});

		try {
			co2Device.close();
		}
		catch(e) {
		}

		process.exit( );
	});

	return {
		setVidPid: 		setVidPid,
		getVidPid: 		getVidPid,
		connect: 		connectToDevice,
		startTransfer: 	startTransfer,
		data: 			getEmitter
	};

}

module.exports = Co2Monitor();
