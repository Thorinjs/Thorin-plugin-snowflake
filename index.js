'use strict';
const initSnowflake = require('./lib/snowflake');
module.exports = function (thorin, opt, pluginName) {
  const defaultOpt = {
    logger: pluginName || 'snowflake',
    debug: false,
    prefix: '',
    id: thorin.id,
    size: 24, // the number of chars the id has, defaults to 17
    offset: ((new Date().getUTCFullYear() - 1970) * 31536000 * 1000)
  };
  opt = thorin.util.extend(defaultOpt, opt);
  // The default options give us numbers like: 47592860786798592
  const Snowflake = initSnowflake(thorin, opt);

  let pluginObj = new Snowflake(opt);

  pluginObj.create = (cOpt = {}) => {
    return new Snowflake(thorin.util.extend(defaultOpt, cOpt));
  }
  return pluginObj;
};
module.exports.publicName = 'snowflake';
