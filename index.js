"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const i2c_bus_1 = require("i2c-bus");
const I2CPortMapSizeMax = 32;
const Uint16Max = 65535;
function parseUint16(string) {
    const n = Number.parseInt(string, 10);
    if (0 <= n && n <= Uint16Max)
        return n;
    else
        throw new RangeError(`Must be between 0 and ${Uint16Max}.`);
}
class I2CAccess {
    constructor(ports) {
        this._ports = ports == null ? new I2CPortMap() : ports;
    }
    get ports() {
        return this._ports;
    }
}
exports.I2CAccess = I2CAccess;
/**
 * Different from Web GPIO API specification.
 */
class I2CPortMap extends Map {
    getByName(portName) {
        const matches = /^i2c-(\d+)$/.exec(portName);
        return matches == null ? undefined : this.get(parseUint16(matches[1]));
    }
}
exports.I2CPortMap = I2CPortMap;
class I2CPort {
    constructor(portNumber) {
        this._portNumber = parseUint16(portNumber.toString());
    }
    get portNumber() {
        return this._portNumber;
    }
    get portName() {
        return `i2c-${this.portNumber}`;
    }
    async open(slaveAddress) {
        const bus = await i2c_bus_1.openPromisified(this.portNumber).catch(error => {
            throw new OperationError(error);
        });
        return {
            slaveAddress,
            read8: cmd => bus.readByte(slaveAddress, cmd).catch(error => {
                throw new OperationError(error);
            }),
            read16: cmd => bus.readWord(slaveAddress, cmd).catch(error => {
                throw new OperationError(error);
            }),
            write8: (cmd, byte) => bus.writeByte(slaveAddress, cmd, byte).catch(error => {
                throw new OperationError(error);
            }),
            write16: (cmd, word) => bus.writeWord(slaveAddress, cmd, word).catch(error => {
                throw new OperationError(error);
            })
        };
    }
}
exports.I2CPort = I2CPort;
class OperationError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.OperationError = OperationError;
async function requestI2CAccess() {
    const ports = new I2CPortMap([...Array(I2CPortMapSizeMax).keys()].map(portNumber => [
        portNumber,
        new I2CPort(portNumber)
    ]));
    return new I2CAccess(ports);
}
exports.requestI2CAccess = requestI2CAccess;
