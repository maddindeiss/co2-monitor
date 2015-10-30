var usb = require('usb');

var IDVENDOR    =  0x04D9;
var IDPRODUCT   =  0xA052;

var co2Device = usb.findByIds(IDVENDOR, IDPRODUCT);

co2Device.open();

var buf = new Buffer(8);
buf.writeUInt8(0xc4,0);
buf.writeUInt8(0xc6,1);
buf.writeUInt8(0xc0,2);
buf.writeUInt8(0x92,3);
buf.writeUInt8(0x40,4);
buf.writeUInt8(0x23,5);
buf.writeUInt8(0xdc,6);
buf.writeUInt8(0x96,7);

co2Device.controlTransfer(0x21,0x09,0x0300,0x00,buf, function(err,data) {
    if(err)
        console.log("co2Device: Error in opening control transfer:" + err);
});

co2Interface = co2Device.interfaces[0];
co2Interface.claim();

co2Endpoint = co2Interface.endpoints[0];

co2Endpoint.on('data', function(data) {
    var decrypted = decrypt(buf, data);

    var values = {};

    var op = decrypted[0];
    values[op] = decrypted[1] << 8 | decrypted[2];

    if (values[80]) {
        var co2 = values[80];
        console.log("CO2: " + co2 + " ppm");
    }

    if (values[66]) {
        var tmp = (values[66]/16.0-273.15).toFixed(3);
        console.log("Temp: " + tmp + " C");
    }

    if (values[68]) {
        var RH = (values[68]/100);
        console.log("RH: " + RH);
    }

});

co2Endpoint.on("error", function(err) {
    console.log("co2Device: Endpoint error: " + err);
});

co2Endpoint.on("end",function() {
    console.log("co2Device: Endpoint stream ending");
});

co2Endpoint.transfer(8, function(err, data) {
    if(err)
        console.log("co2Device: Endpoint transfer error: " + err);
});

co2Endpoint.startPoll(8, 64);


function decrypt(buf, data) {
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


