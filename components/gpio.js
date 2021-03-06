var config = require('config');
var gpio = require('pi-gpio');
var console = process.console;

function GPIO(callback) {
    // constructor
    this.callback = callback;

    this.options = {
        qos: config.get('gpio.qos'),
        retain: config.get('gpio.retain')
    };

    this._init();
}

GPIO.prototype._init = function () {
    var that = this;
    this.portCache = [];

    var ports = config.get('gpio.ports');
    ports.forEach(function (port) {
        that._initRead(port.port, port.interval, port.channel);
        console.info('Initialized GPIO scanning on port %s', port.port);
    })
};

GPIO.prototype._initRead = function (port, interval, channel) {
    var that = this;

    gpio.open(port, 'input', function (err) {
        if (err) {
            console.error(err);
        }
        else {
            setInterval(function () {
                that.read(port, channel);
            }, interval)
        }
    })
};

GPIO.prototype.read = function (port, channel) {
    var that = this;

    gpio.read(port, function (err, val) {
        if (err) {
            console.error(err);
        }
        else {
            if (
              !config.get('gpio.only_send_updates') ||
              !(port in that.portCache) ||
              that.portCache[port] != val
            ) {
                that.portCache[port] = val;

                var payload = {
                    value: val
                };
                that.callback(channel, payload, that.options);
            }
        }
    });
};

process.on('exit', function () {
    var ports = config.get('gpio.ports');
    ports.forEach(function (port) {
        gpio.close(port.port);
        console.info('Closed GPIO port %s', port.port);
    })
});

module.exports = GPIO;
