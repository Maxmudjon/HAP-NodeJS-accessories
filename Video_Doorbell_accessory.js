'use strict';
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var clone = require('../').clone;
var tlv = require('../').tlv;
var RTPProxy = require('../').RTPProxy;
var crypto = require('crypto');
var ip = require('ip');
var bufferShim = require('buffer-shims');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Camera = require('../').Camera;

//..........EDIT HERE...............//
console.log("Video Doorbell Connecting to MQTT broker...");
var name = "Video Doorbell";
var name2 = "Video Doorbell"
var UUID = "bio*xhome:aksesuarlari:vq(v01)01";
var MACADRESI = "B1:5C:00:00:00:00";
var MQTT_IP = "192.168.1.103" //Mosquitto server ip adress
var dt0Topigi = 'VIDEO_DOORBELL/#'
var dt1Topigi = 'VIDEO_DOORBELL/DIN_DON'
var qulfTopigi = 'VIDEO_DOORBELL/LOCK_MECHANISIM'
var mijozBelgisi = 'VIDEO DOORBELL';
var PINKOD = "000-00-000";
var SERIALRAQAMI = "BHVQ-V1-0001";
console.log("Video Doorbell Connected");
//..........EDIT HERE...............//


// MQTT Settings
var options = {
  port: 1883,
  host: MQTT_IP,
  clientId: mijozBelgisi
};
var client = mqtt.connect(options);
client.subscribe(dt0Topigi);
client.on('message', function(topic, message) {
  console.log(parseFloat(message));
  if(topic == dt1Topigi) {
    PROGRAMMABLE_SWITCH.din_don = parseFloat(message);
  } 
});

var dtUUID = uuid.generate(UUID);
var ProgrammableSwitch = exports.accessory = new Accessory(name, dtUUID);

ProgrammableSwitch.username = MACADRESI;
ProgrammableSwitch.pincode = PINKOD;
ProgrammableSwitch.category = Accessory.Categories.VIDEO_DOORBELL;

var PROGRAMMABLE_SWITCH = {

  din_don: 0,
  locked: true,
  
  get_din_don: function() {
     return PROGRAMMABLE_SWITCH.din_don;
  },

  lock: function() { 
    console.log("Locked!");
    PROGRAMMABLE_SWITCH.locked = true;

    client.publish(qulfTopigi, 'lock');
    
  },

  unlock: function() { 
    console.log("Unlocked!");
    PROGRAMMABLE_SWITCH.locked = false;

    client.publish(qulfTopigi, 'unlock');
    
  },

  identify: function() {
    console.log(name, " identifyed!");
 }

}

var cameraSource = new Camera();

ProgrammableSwitch.configureCameraSource(cameraSource);

ProgrammableSwitch
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Bio*X HOME")
  .setCharacteristic(Characteristic.Model, "2017 - V1")
  .setCharacteristic(Characteristic.SerialNumber, SERIALRAQAMI);

ProgrammableSwitch.on('identify', function(paired, callback) {
  PROGRAMMABLE_SWITCH.identify();
  callback(); 
});

ProgrammableSwitch
 .addService(Service.Doorbell, name2)
 .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
 .on('get', function(callback){

   callback(null, PROGRAMMABLE_SWITCH.get_din_don);   
 });

 
ProgrammableSwitch
 .getService(Service.CameraControl)
 .getCharacteristic(Characteristic.On)
 .on('get', function(callback){

 	callback(null, ProgrammableSwitch.configureCameraSource(cameraSource));
 });

ProgrammableSwitch
 .addService(Service.LockMechanism, "Video Doorbell Lock")
 .getCharacteristic(Characteristic.LockTargetState)
 .on('set', function(value, callback) {

    if (value == Characteristic.LockTargetState.UNSECURED) {
      PROGRAMMABLE_SWITCH.unlock();
      callback(); 

      ProgrammableSwitch
        .getService(Service.LockMechanism)
        .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
    }
    else if (value == Characteristic.LockTargetState.SECURED) {
      PROGRAMMABLE_SWITCH.lock();
      callback(); 

      ProgrammableSwitch
        .getService(Service.LockMechanism)
        .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    }
 });

ProgrammableSwitch
  .getService(Service.LockMechanism)
  .getCharacteristic(Characteristic.LockCurrentState)
  .on('get', function(callback) {

    var err = null; 

    if (PROGRAMMABLE_SWITCH.locked) {
      console.log("Locked? Yes.");
      callback(err, Characteristic.LockCurrentState.SECURED);
    }
    else {
      console.log("Locked? No.");
      callback(err, Characteristic.LockCurrentState.UNSECURED);
    }
 });

setInterval(function(){

 if(PROGRAMMABLE_SWITCH.din_don == 1) {

    ProgrammableSwitch
     .getService(Service.Doorbell)
     .setCharacteristic(Characteristic.ProgrammableSwitchEvent, PROGRAMMABLE_SWITCH.get_din_don());
     2000
    client.publish(dt1Topigi, String(0));

 }

}, 1000);


//@mail: bio42@mail.ru, payziyev@gmail.com
//Facebook.com/payziyev | Instagram: payziyev | Twitter: @Maxmudjon
//1 version
