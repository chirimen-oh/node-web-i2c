import { openPromisified } from 'i2c-bus';

/**
 * I2C Port Map Max サイズ
 */
const I2CPortMapSizeMax = 32;

/**
 * Uint16 Max サイズ
 */
const Uint16Max = 65535;

/**
 *
 * Uint16型変換処理
 * @param parseString 変換文字列
 * @return Uint16型変換値
 */
function parseUint16(parseString: string) {
  const n = Number.parseInt(parseString, 10);
  if (0 <= n && n <= Uint16Max) return n;
  else throw new RangeError(`Must be between 0 and ${Uint16Max}.`);
}

/** ポート番号 */
type PortNumber = number;
/** ポート名 */
type PortName = string;

/** I2C Slave アドレス */
type I2CSlaveAddress = number;

/**
 * I2CAccess クラス定義
 */
export class I2CAccess {
  private readonly _ports: I2CPortMap;

  /**
   * Creates an instance of GPIOAccess.
   * @param ports ポート番号
   */
  constructor(ports?: I2CPortMap) {
    this._ports = ports == null ? new I2CPortMap() : ports;
  }

  /**
   * ポート情報取得処理
   * @return 現在のポート情報
   */
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

/**
 * I2CPort クラス定義
 */
export class I2CPort {
  private readonly _portNumber: PortNumber;

  /**
   * Creates an instance of GPIOPort.
   * @param portNumber ポート番号
   */
  constructor(portNumber: PortNumber) {
    this._portNumber = parseUint16(portNumber.toString());
  }

  /**
   * ポート番号取得処理
   * @return 現在のポート番号
   */
  get portNumber(): PortNumber {
    return this._portNumber;
  }

  /**
   * ポート名取得処理
   * @return 現在のポート名
   */
  get portName(): string {
    return `i2c-${this.portNumber}`;
  }

  /**
   * I2CSlave 接続デバイスオープン処理
   * @param slaveAddress 接続デバイス情報のアドレス
   * @return I2CSlaveDevice インスタンスの生成の完了
   */
  async open(slaveAddress: I2CSlaveAddress): Promise<I2CSlaveDevice> {
    const bus = await openPromisified(this.portNumber).catch((error) => {
      throw new OperationError(error);
    });

    return {
      slaveAddress,
      /**
       * @function
       * I2C 読み取り処理
       * @param registerNumber 読み取りアドレス
       */
      read8: (registerNumber) =>
        bus.readByte(slaveAddress, registerNumber).catch((error) => {
          throw new OperationError(error);
        }),
      /**
       * @function
       * I2C 読み取り処理
       * @param registerNumber 読み取りアドレス
       */
      read16: (registerNumber) =>
        bus.readWord(slaveAddress, registerNumber).catch((error) => {
          throw new OperationError(error);
        }),
      /**
       * @function
       * I2c s/I2c/I2C 書き込み処理
       * @param registerNumber 書き込みアドレス
       * @param byte 書き込みの値（バイト）
       */
      write8: async (registerNumber, byte) => {
        try {
          await bus.writeByte(slaveAddress, registerNumber, byte);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /**
       * @function
       * I2c bytes 書き込み処理
       * @param registerNumber 書き込みアドレス
       * @param word 書き込みの値（ワード）
       */
      write16: async (registerNumber, word) => {
        try {
          await bus.writeWord(slaveAddress, registerNumber, word);
          return word;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /**
       * @function
       * I2c bytes 読み取りバイト処理
       * Different from Web I2C API specification.
       */
      readByte: async () => {
        try {
          const byte = await bus.receiveByte(slaveAddress);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /**
       * @function
       * I2c bytes 読み取りバイト処理
       * Different from Web I2C API specification.
       * @param length 読み取る配列の長さ
       */
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
      /**
       * @function
       * I2c bytes 書き込みバイト処理
       * Different from Web I2C API specification.
       *  @param byte 書き込みの値
       */
      writeByte: async (byte) => {
        try {
          await bus.sendByte(slaveAddress, byte);
          return byte;
        } catch (error: any) {
          throw new OperationError(error);
        }
      },
      /**
       * @function
       * I2c bytes 書き込み処理
       * Different from Web I2C API specification.
       * @param 書き込みの値の配列
       */
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

/**
 * I2CSlaveDevice クラス
 */
export interface I2CSlaveDevice {
  /** I2C Slave アドレス */
  readonly slaveAddress: I2CSlaveAddress;

  /**
   * @function
   * I2C 読み取り処理
   * @param registerNumber 読み取りアドレス
   */
  read8(registerNumber: number): Promise<number>;
  /**
   * @function
   * I2C 読み取り処理
   * @param registerNumber 読み取りアドレス
   */
  read16(registerNumber: number): Promise<number>;
  /**
   * @function
   * I2c s/I2c/I2C 書き込み処理
   * @param registerNumber 書き込みアドレス
   * @param value 書き込みの値（バイト）
   */
  write8(registerNumber: number, value: number): Promise<number>;
  /**
   * @function
   * I2c bytes 書き込み処理
   * @param registerNumber 書き込みアドレス
   * @param value 書き込みの値（ワード）
   */
  write16(registerNumber: number, value: number): Promise<number>;

  /**
   * @function
   * I2c bytes 読み取りバイト処理
   * Different from Web I2C API specification.
   */
  readByte(): Promise<number>;
  /**
   * @function
   * I2c bytes 読み取りバイト処理
   * Different from Web I2C API specification.
   * @param length 読み取る配列の長さ
   */
  readBytes(length: number): Promise<Uint8Array>;
  /**
   * @function
   * I2c bytes 書き込みバイト処理
   * Different from Web I2C API specification.
   * @param byte 書き込みの値
   */
  writeByte(byte: number): Promise<number>;
  /**
   * @function
   * I2c bytes 書き込みバイト配列処理
   * Different from Web I2C API specification.
   * @param bytes 書き込みの値
   */
  writeBytes(bytes: Array<number>): Promise<Uint8Array>;
}

/**
 * 操作エラー
 */
export class OperationError extends Error {
  /**
   * Creates an instance of OperationError.
   * @param message エラーメッセージ
   */
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
