'use strict';
module.exports = function init(thorin, opt) {

  class Snowflake {

    #config = {};
    #idSeq = 0;
    #idMsg = 0;
    #idOffset;
    #lastTime = 0;

    constructor(config) {
      this.#config = config || opt;
      this.#idOffset = config.offset || 0;
      let id = this.#config.id || '';
      for (let i = 0, len = id.length; i < len; i++) {
        this.#idMsg += id.charCodeAt(i);
      }
      this.#idMsg = this.#idMsg % 1023;
    }

    /**
     * Generate a new id
     * */
    generate(prefix) {
      const time = Date.now(),
        bTime = (time - this.#idOffset).toString(2);
      if (!prefix && this.#config.prefix) {
        prefix = this.#config.prefix;
      }
      if (typeof prefix === 'number') prefix = prefix.toString();
      if (this.#lastTime === time) {
        this.#idSeq++;
        if (this.#idSeq > 4095) {
          this.#idSeq = 0;
          while (Date.now() <= time) {//make system wait till time is been shifted by one millisecond
          }
        }
      } else {
        this.#idSeq = 0;
      }
      this.#lastTime = time;
      let bSeq = this.#idSeq.toString(2),
        bMid = this.#idMsg.toString(2);
      //create sequence binary bit
      while (bSeq.length < 12) bSeq = "0" + bSeq;
      while (bMid.length < 10) bMid = "0" + bMid;
      const bid = bTime + bMid + bSeq;
      let id = "";
      for (let i = bid.length; i > 0; i -= 4) {
        id = parseInt(bid.substring(i - 4, i), 2).toString(16) + id;
      }
      let res = hexToDec(id);
      if (!res) return null;
      if (typeof prefix === 'string' && prefix) {
        res = prefix + res.substr(prefix.length);
      }
      if (res.length > this.#config.size) {
        let diff = res.length - this.#config.size;
        res = res.substr(diff);
      }
      return res;
    }

  }

  return Snowflake;
}


function hexToDec(hexStr) {
  if (hexStr.substr(0, 2) === "0x") hexStr = hexStr.substr(2);
  hexStr = hexStr.toLowerCase();
  return convertBase(hexStr, 16, 10);
}


/**
 * A function for converting hex <-> dec w/o loss of precision.
 * By Dan Vanderkam http://www.danvk.org/hex2dec.html
 * FlakeID inspiration: https://github.com/s-yadav/FlakeId
 */
// Adds two arrays for the given base (10 or 16), returning the result.
// This turns out to be the only "primitive" operation we need.
function add(x, y, base) {
  let z = [];
  let n = Math.max(x.length, y.length);
  let carry = 0;
  let i = 0;
  while (i < n || carry) {
    let xi = i < x.length ? x[i] : 0;
    let yi = i < y.length ? y[i] : 0;
    let zi = carry + xi + yi;
    z.push(zi % base);
    carry = Math.floor(zi / base);
    i++;
  }

  return z;
}

// Returns a*x, where x is an array of decimal digits and a is an ordinary
// JavaScript number. base is the number base of the array x.
function multiplyByNumber(num, x, base) {
  if (num < 0) return null;
  if (num === 0) return [];
  let result = [];
  let power = x;
  while (true) {
    if (num & 1) {
      result = add(result, power, base);
    }
    num = num >> 1;
    if (num === 0) break;
    power = add(power, power, base);
  }
  return result;
}

function parseToDigitsArray(str, base) {
  let digits = str.split("");
  let ary = [];
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], base);
    if (isNaN(n)) return null;
    ary.push(n);
  }
  return ary;
}

function convertBase(str, fromBase, toBase) {
  let digits = parseToDigitsArray(str, fromBase);
  if (digits === null) return null;
  let outArray = [];
  let power = [1];
  for (let i = 0; i < digits.length; i++) {
    if (digits[i]) {
      outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
    }
    power = multiplyByNumber(fromBase, power, toBase);
  }
  let out = "";
  for (let i = outArray.length - 1; i >= 0; i--) {
    out += outArray[i].toString(toBase);
  }
  return out;
}
