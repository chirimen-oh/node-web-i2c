# @notweb/i2c

I2C access with Node.js

## Usage

```js
const { requestI2CAccess } = require("@notweb/i2c");

const ADT7410_ADDR = 0x48;

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const i2cSlave = await port.open(ADT7410_ADDR);
  const temperature =
    (((await i2cSlave.read8(0x00)) << 8) + (await i2cSlave.read8(0x01))) / 128;
  console.log(`Temperature: ${temperature} ℃`);
}

main();
```

## Document

[Web I2C API](http://browserobo.github.io/WebI2C)
