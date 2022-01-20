# node-web-i2c

I2C access with Node.js

## Usage

```js
const { requestI2CAccess } = require("node-web-i2c");
const ADT7410 = require("@chirimen/adt7410");

const ADT7410_ADDR = 0x48;

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const adt7410 = new ADT7410(port, ADT7410_ADDR);
  await adt7410.init();
  const temperature = await adt7410.read();
  console.log(`Temperature: ${temperature} ℃`);
}

main();
```

## Document

[Web I2C API](http://browserobo.github.io/WebI2C)
