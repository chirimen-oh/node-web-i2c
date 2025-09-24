# node-web-i2c

I2C access with Node.js

## Usage

```
$ npm i node-web-i2c
```

```js
import { requestI2CAccess } from "node-web-i2c";
import ADT7410 from "@chirimen/adt7410";

const i2cAccess = await requestI2CAccess();
const adt7410 = new ADT7410(i2cAccess.ports.get(1), 0x48);
await adt7410.init();
const temperature = await adt7410.read();
console.log(`Temperature: ${temperature} ℃`);
```

## Document

- [TSDoc](http://www.chirimen.org/node-web-i2c/)

## Reference

- [Web I2C API for W3C Draft](http://browserobo.github.io/WebI2C)
