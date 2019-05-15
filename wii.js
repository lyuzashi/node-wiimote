var version = "0.1.0";

var HID = require('node-hid');
var colors = require('colors');
var dead = 10;

var bindings = [
	{
		prettyName: "D-Pad Left",
		handlerType: "button_left",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 1,
				atBit: 1
			}
		}
	},
	{
		prettyName: "D-Pad Right",
		handlerType: "button_right",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 1,
				atBit: 2
			}
		}
	},
	{
		prettyName: "D-Pad Down",
		handlerType: "button_down",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 1,
				atBit: 3
			}
		}
	},
	{
		prettyName: "D-Pad Up",
		handlerType: "button_up",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 1,
				atBit: 4
			}
		}
	},
	{
		prettyName: "Plus",
		handlerType: "button_plus",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 1,
				atBit: 5
			}
		}
	},
	{
		prettyName: "Two",
		handlerType: "button_2",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 1
			}
		}
	},
	{
		prettyName: "One",
		handlerType: "button_1",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 2
			}
		}
	},
	{
		prettyName: "B",
		handlerType: "button_b",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 3
			}
		}
	},
	{
		prettyName: "A",
		handlerType: "button_a",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 4
			}
		}
	},
	{
		prettyName: "Minus",
		handlerType: "button_minus",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 5
			}
		}
	},
	{
		prettyName: "Home",
		handlerType: "button_home",
		actiontype: "toggle",
		foundIn: {
			"0x30": {
				inByte: 2,
				atBit: 8
			}
		}
	}
];

// 1: 0x01, 2: 0x02, 3: 0x04, 4: 0x08, 5: 0x10, 6: 0x20, 7: 0x40, 8: 0x80

var WiiController = function() {
	this.last = {buttons: {}}; // Setup shit I need
	
	this.vibrating = false;
	this.lightsState = 0;
	
	this.eventListeners = [];
	
	var u = this; 
	
	// NOT MY CODE

	var devices = HID.devices(); // Ok kinda get this

	devices.forEach((function(d) { // I have no fucking idea what this does. But it's good cause I need it :)
		if(typeof d === 'object' && d.product !== undefined) {
			if (d.product.toLowerCase().indexOf('rvl-cnt') !== -1) {
				u.hid = new HID.HID(d.path)
			}
		}
	}).bind(this)) 

	// NOW WE BACK TO MY CODE I WANT TO DIE AAAAAAAAAH
	try{
		// Fire event listener.
		this.hid.on("data", function(e) {
			// Detect Message type & Values
			u.exists = true;
			if (e[0] == 0x30) { // Ensure message type == 0x30, this is default button type. And is all that is handled at the moment.
				var reportCode = "0x30";
				// Brace
				var found = {};
				var eventsToRun = {};
				
				// Do maths to this bitch
				var copiedBytes = [];
				
				for (var i = 0; i < e.length; i++) {
					copiedBytes.push(e[i]);
				}
				copiedBytes.shift();
				
				// Put maths in this bitch
				var bitsMap = [];
				
				// Bit conversion to a map in bitsMap[byteNum][bitNum]
				for (var i = 0; i < copiedBytes.length; i++) {
					bitsMap.push([]);
					for (var j = 0; j < 8; j ++) {
						var czech = Math.pow(2, (7 - j));
						if (copiedBytes[i] - czech >= 0) {
							copiedBytes[i] -= czech;
							bitsMap[i].push(true);
						} else {
							bitsMap[i].push(false);
						}
					}
					bitsMap[i].reverse();
				}
			
				
				// Now that I have a map of all the things, look through the bindings and convert it to values.
				for (var i = 0; i < bindings.length; i++) {
					var work = bindings[i];
					
					// If the binding is in this here report
					if (work.foundIn[reportCode] !== undefined) {
						// Then lets do some meth!
						// If it has a toggle type (such as buttons)
						if (work.actiontype == "toggle") {
							// It should have only one bit per report
							var sevn = work.foundIn[reportCode];
							
							found[work.handlerType] = {
								type: "toggle",
								value: bitsMap[sevn.inByte - 1][sevn.atBit - 1] == true
							}
						}
					}
				}
			
				// Find values
				
				// Then enumerate events, comparing then and firing events.
				
				// Now I should have some found values yay;
				
				var foundKeys = Object.keys(found);// BC IM LAZY
				var lastKeys = Object.keys(u.last); 
				
				
				for (var i = 0; i < foundKeys.length; i++) { // Using foundkeys because I'm lazy as shit.
					if (lastKeys.indexOf(foundKeys[i]) == -1) {
						// Then it wasn't there the previous time
						if (found[foundKeys[i]].type = "toggle") {
							if (found[foundKeys[i]].value == true && false == false) { // If pressed now and not before,
								eventsToRun[foundKeys[i]] = "pressed"; // Saving that pressed event is correct
							} else if (found[foundKeys[i]].value == false && false == true) { // If released as an else if because fuck you and fuck me, that's why
								eventsToRun[foundKeys[i]] = "released"; // Saving that released event is correct
							} 
						}
					} else {
						// Then it was there before so actually compare it twat
						if (found[foundKeys[i]].type = "toggle") {
							if (found[foundKeys[i]].value == true && u.last[foundKeys[i]].value == false) { // If pressed now and not before,
								eventsToRun[foundKeys[i]] = "pressed"; // Saving that pressed event is correct
							} else if (found[foundKeys[i]].value == false && u.last[foundKeys[i]].value == true) { // If released as an else if because fuck you and fuck me, that's why
								eventsToRun[foundKeys[i]] = "released"; // Saving that released event is correct
							} 
						}
					}
				}
				
				// Now to fucking enumerate the events.
				// BTW: Assuming there will likely only be one change per call of this function.
				
				var eventKeysYawn = Object.keys(eventsToRun); // Lazy
				
				for (var i = 0; i < eventKeysYawn.length; i++) {
					var sevn = eventKeysYawn[i];
					for (var j = 0; j < u.eventListeners.length; j++) {
						if ((u.eventListeners[j].type == sevn || u.eventListeners[j].type == "all" || u.eventListeners[j].type == "*") && (u.eventListeners[j].action == eventsToRun[sevn] || u.eventListeners[j].action == "all" || u.eventListeners[j].action == "*")) {
							u.eventListeners[j].callback({type: sevn, action: eventsToRun[sevn]});
						}
					}
				}
				
				u.last = found; // Get ready for the next event
			} else if (e[0] == 0x20) { // If the wiimote sends a status report (regardless if requested)
				u.hid.write([0x12, 0x00, 0x30]); // Send a message to change the reporting mode to 0x30 (default)
				// Debug Mode:
				// console.log("Recieved Status Report:\n", e)
			} else {
				console.log("I found a report that I have no idea what to do with");
				console.log("We are working very hard to support all types of report, so please make sure you have the latest version. Current: " + version);
				console.log("If you have the latest version, keep a note of the following information");
				console.log(e);
				console.log("Please send it in as a bug report on git, if there is already data that matches yours just comment on it please!");
				console.log("Alternatively, use the Wiimote documentation on Wiibrew to figure out what is going on and submit that, or fix it and submit a pull request.");
				u.hid.write([0x12, 0x00, 0x30]);
			}
		});
		this.exists = true;
	}
	catch ( ex ){
		console.log( 'Error: '.red, 'Wii controller could not be found.' );
		this.exists = false;
	}
}

var WiiListenerToken = function() {
	this.token = Math.floor(10000000 * Math.random());
	
	return this;
};

WiiController.prototype.on = function(type, action, callback) { // The most important function. Why? Because this makes sure nothing else gets shafted
	var typeSHIIIT = true;
	var actionSHIIIT = false;
	for (var i = 0; i < bindings.length; i++) {
		if (type == bindings[i].handlerType) {
			typeSHIIIT = false;
			break;
		}
	}
	
	if (type == "*" || type == "all") {
		typeSHIIIT = false;
	}
	
	if (action == "*" || action == "all") {
		actionSHIIIT = false;
	}
	
	if (typeSHIIIT) {
		console.log( 'Error: '.red, 'Invalid event type specified (see docs)' );
		return;
	}
	
	if (actionSHIIIT) {
		console.log( 'Error: '.red, 'Invalid action type specified (pressed or released' );
		return;
	}
	
	var createdToken = new WiiListenerToken()
	this.eventListeners.push({
		type: type,
		action: action,
		callback: callback,
		token: createdToken,
	});
	
	return createdToken;
};

WiiController.prototype.off = function(token, action) {
	if (typeof token == "WiiListenerToken") {
		var confiorm = false;
		for (var i = 0; i < this.eventListeners.length; i++) {
			if (token == eventListeners[i].token) {
				eventListeners.splice(i, 1);
				confiorm = true;
				return;
			}
		}
		if (!confiorm) {
			console.log( 'Error: '.red, 'Token could not find an event listener.' );
		}
	} else if (typeof token == "string") {
		
	} else {
		console.log( 'Error: '.red, 'Provided argument is not a Token. (tokens are returned from WiiController.on)' );
	}
}


// THE EASY SHIT OHHHHHHHHHHHHHHHH
WiiController.prototype.setLights = function(lx1, lx2, lx3, lx4) {
	// Validation
	if (typeof lx1 !== "boolean" || typeof lx2 !== "boolean" || typeof lx3 !== "boolean" || typeof lx4 !== "boolean") {
		console.log( 'Error: '.red, 'all values should be true or false (total 4 args required)' );
		return;
	} else {
		// Calculate out the value
		var total = 0;
		if (lx1) {
			total += 16;
		}
		if (lx2) {
			total += 32;
		}
		if (lx3) {
			total +=64;
		}
		if (lx4) {
			total += 128;
		}
		this.lightsState = total; // Store this number for later
		if (this.vibrating) { // Vibration is in same packet, so ensure same
			total += 1;
		}
		// Send command
		this.hid.write([0x11, total]);
	}
};

WiiController.prototype.vibrate = function(value) {
	var u  = this;
	
	// Validation and do things
	if (typeof value == "boolean") {
		// Load current lights state
		var total = this.lightsState;
		if (value) { // Add to lights state
			total += 1;
		}
		
		this.vibrating = value; // Remember current vibration
		
		// Send command
		this.hid.write([0x11, total]);
		
	} else if (typeof value == "number") {
		if (value < 10) {
			console.log( 'Error: '.red, 'detected a vibration length but value is too short' );
		}
		
		// Load current lights state
		var total = this.lightsState;
		// Add to lights state
		total += 1;
		
		this.vibrating = true; // Remember current vibration
		
		// Send command
		this.hid.write([0x11, total]);
		
		// Then send second false command to show no more vibration
		setTimeout(function() {u.vibrate(false);}, value);
	} else {
		console.log( 'Error: '.red, 'argument 1 should be boolean or a duration (total 1 arg required)' );
		return;
	}
};

WiiController.prototype.listEvents = function() {
	console.log("");
	for (var i = 0; i < bindings.length; i++) {
		console.log(bindings[i].prettyName + ": " + bindings[i].handlerType);
	}
};

module.exports = WiiController