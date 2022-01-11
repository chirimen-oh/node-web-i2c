import { openPromisified } from 'i2c-bus';

const I2CPortMapSizeMax = 32;

const Uint16Max = 65535;

function parseUint16(parseString: string) {
  const n = Number.parseInt(parseString, 10);
  if (0 <= n && n <= Uint16Max) return n;
  else throw new RangeError(`Must be between 0 and ${Uint16Max}.`);
}

type PortNumber = number;
type PortName = string;

type I2CSlaveAddress = number;

export class I2CAccess {
  private readonly _ports: I2CPortMap;

  constructor(ports?: I2CPortMap) {
    this._ports = ports == null ? new I2CPortMap() : ports;
  }

  get ports(): I2CPortMap {
    return this._ports;
  }
}

/** Different from Web I2C API specification. */
export class I2CPortMap extends Map<PortNumber, I2CPort> {
  getByName(portName: PortName): I2CPort | undefined {
    const matches = /^i2c-(\d+)$/.exec(portName);
    return matches == null ? undefined : this.get(parseUint16(matches[1]));
  }
}

export class I2CPort {
  private readonly _portNumber: PortNumber;

  constructor(portNumber: PortNumber) {
    this._portNumber = parseUint16(portNumber.toString());
  }

  get portNumber(): PortNumber {
    return this._portNumber;
  }

  get portName(): string {
    return `i2c-${this.portNumber}`;
  }

  async open(slaveAddress: I2CSlaveAddress): Promise<I2CSlaveDevice> {
    const bus = await openPromisified(this.portNumber).catch((error) => {
      throw new OperationError(error);
    });

    return {
      slaveAddress,
      read8: (cmd) =>
        bus.readByte(slaveAddress, cmd).catch((error) => {
          throw new OperationError(error);
        }),
      read16: (cmd) =>
        bus.readWord(slaveAddress, cmd).catch((error) => {
          throw new OperationError(error);
        }),
      write8: async (cmd, byte) => {
        try {
          await bus.writeByte(slaveAddress, cmd, byte);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      write16: async (cmd, word) => {
        try {
          await bus.writeWord(slaveAddress, cmd, word);
          return word;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },

      /** Different from Web I2C API specification. */
      readByte: async () => {
        try {
          const byte = await bus.receiveByte(slaveAddress);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /** Different from Web I2C API specification. */
      readBytes: async (length) => {
        try {
          const { bytesRead, buffer } = await bus.i2cRead(
            slaveAddress,
            length,
            Buffer.allocUnsafe(length)
          );
          return new Uint8Array(buffer.slice(0, bytesRead));
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /** Different from Web I2C API specification. */
      writeByte: async (byte) => {
        try {
          await bus.sendByte(slaveAddress, byte);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /** Different from Web I2C API specification. */
      writeBytes: async (bytes) => {
        try {
          const { bytesWritten, buffer } = await bus.i2cWrite(
            slaveAddress,
            bytes.length,
            Buffer.from(bytes)
          );
          return new Uint8Array(buffer.slice(0, bytesWritten));
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
    };
  }
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

export class OperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Web I2Cの仕様に基づく意図的なasync関数の使用なので、ルールを無効化
// eslint-disable-next-line
export async function requestI2CAccess(): Promise<I2CAccess> {
  const ports = new I2CPortMap(
    [...Array(I2CPortMapSizeMax).keys()].map((portNumber) => [
      portNumber,
      new I2CPort(portNumber),
    ])
  );

  return new I2CAccess(ports);
}
