const isPlainObject = require("lodash.isplainobject");

/**
 * Options Manager
 *
 * Input Options: Object
 * Output: Array of plugins enabled with their options
 *
 * Handles multiple types of input option keys
 *
 * 1. boolean and object values
 * { mangle: true } // should enable mangler
 * { mangle: { blacklist: ["foo"] } } // should enabled mangler
 *                                    // and pass obj to mangle plugin
 *
 * 2. group
 * { unsafe: true } // should enable all plugins under unsafe
 * { unsafe: { flip: false } } // should disable flip-comparisons plugin
 *                             // and other plugins should take their defaults
 * { unsafe: { simplify: {multipass: true}}} // should pass obj to simplify
 *                                           // other plugins take defaults
 *
 * 3. same option passed on to multiple plugins
 * { keepFnames: false } // should be passed on to mangle & dce
 *                       // without disturbing their own options
 */
module.exports = class OptionsManager {
  constructor(proxies, inputOpts) {
    this.result = [];
    this.inputOpts = inputOpts;

    // proxies are passed on to the respective plugins
    this.proxies = invertMapping(proxies);

    // the current level to track within group calls
    this.state = this.inputOpts;
    this.previousStates = [];
  }

  addOption(optionKey, resolvingValue, defaultOptionValue) {
    const opts = this.state;
    // preset(undefined)
    // or { unsafe: undefined } when in a group
    if (typeof opts === "undefined") {
      if (defaultOptionValue) {
        this.result.push(this.resolve(optionKey, resolvingValue));
      }
    } else
    // preset({ [optionKey]: <value> })
    if (isPlainObject(opts) && hop(opts, optionKey)) {
      // { mangle: { blacklist: ['foo'] }}
      if (isPlainObject(opts[optionKey])) {
        this.result.push(this.resolve(optionKey, resolvingValue, opts[optionKey]));
      } else
      // { mangle: true }
      // any truthy value enables the plugin
      if (opts[optionKey]) {
        this.result.push(this.resolve(optionKey, resolvingValue));
      }
    } else
    // { } -> mangle is not a property
    if (defaultOptionValue) {
      this.result.push(this.resolve(optionKey, resolvingValue));
    }
    // chain
    return this;
  }

  addGroup(optionKey, fn) {
    const opts = this.state;
    if (isPlainObject(opts) && (!hop(opts, optionKey) || opts[optionKey])) {
      this.pushState(optionKey);
      fn.call(null, this);
      this.popState();
    }
    // chain
    return this;
  }

  resolve(optionKey, resolvingValue, resolveOpts) {
    const opts = this.state;
    if (hop(this.proxies, optionKey)) {
      const proxiedOpts = {};
      this.proxies[optionKey].forEach((p) => {
        if (hop(opts, p)) {
          Object.assign(proxiedOpts, {
            [p]: opts[p]
          });
        }
      });
      if (isPlainObject(resolveOpts)) {
        Object.assign(proxiedOpts, resolveOpts);
      }
      if (Object.keys(proxiedOpts).length > 0) {
        return [resolvingValue, proxiedOpts];
      }
    }
    return resolvingValue;
  }

  pushState(key) {
    this.previousStates.push(this.state);
    this.state = this.state[key];
  }

  popState() {
    this.state = this.previousStates.pop();
  }
};

function invertMapping(map) {
  const inverted = {};
  Object.keys(map).forEach((key) => {
    map[key].forEach((option) => {
      if (!hop(inverted, option)) {
        inverted[option] = [];
      }
      inverted[option].push(key);
    });
  });
  return inverted;
}

function hop(o, k) {
  return Object.prototype.hasOwnProperty.call(o, k);
}
