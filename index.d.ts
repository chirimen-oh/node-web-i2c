declare type PortNumber = number;
declare type PortName = string;
declare type I2CSlaveAddress = number;
export declare class I2CAccess {
    private readonly _ports;
    constructor(ports?: I2CPortMap);
    get ports(): I2CPortMap;
}
/** Different from Web I2C API specification. */
export declare class I2CPortMap extends Map<PortNumber, I2CPort> {
    getByName(portName: PortName): I2CPort | undefined;
}
export declare class I2CPort {
    private readonly _portNumber;
    constructor(portNumber: PortNumber);
    get portNumber(): number;
    get portName(): string;
    open(slaveAddress: I2CSlaveAddress): Promise<I2CSlaveDevice>;
}
export interface I2CSlaveDevice {
    readonly slaveAddress: I2CSlaveAddress;
    read8(registerNumber: number): Promise<number>;
    read16(registerNumber: number): Promise<number>;
    write8(registerNumber: number, value: number): Promise<number>;
    write16(registerNumber: number, value: number): Promise<number>;
    /** Different from Web I2C API specification. */
    readByte(): Promise<number>;
    /** Different from Web I2C API specification. */
    readBytes(length: number): Promise<Uint8Array>;
    /** Different from Web I2C API specification. */
    writeByte(byte: number): Promise<number>;
    /** Different from Web I2C API specification. */
    writeBytes(bytes: Array<number>): Promise<Uint8Array>;
}
export declare class OperationError extends Error {
    constructor(message: string);
}
export declare function requestI2CAccess(): Promise<I2CAccess>;
export {};
