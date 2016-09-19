const isPlainObject = require("lodash.isplainobject");

// the flat plugin map
// This is to prevent dynamic requires - require('babel-plugin-' + name);
// as it suffers during bundling of this code with webpack/browserify
const PLUGINS = {
  "minify-constant-folding":                 require("babel-plugin-minify-constant-folding"),
  "minify-dead-code-elimination":            require("babel-plugin-minify-dead-code-elimination"),
  "minify-flip-comparisons":                 require("babel-plugin-minify-flip-comparisons"),
  "transform-simplify-comparison-operators": require("babel-plugin-transform-simplify-comparison-operators"),
  "minify-guarded-expressions":              require("babel-plugin-minify-guarded-expressions"),
  "minify-type-constructors":                require("babel-plugin-minify-type-constructors"),
  "minify-infinity":                         require("babel-plugin-minify-infinity"),
  "minify-mangle-names":                     require("babel-plugin-minify-mangle-names"),
  "minify-replace":                          require("babel-plugin-minify-replace"),
  "minify-simplify":                         require("babel-plugin-minify-simplify"),
  "transform-member-expression-literals":    require("babel-plugin-transform-member-expression-literals"),
  "transform-property-literals":             require("babel-plugin-transform-property-literals"),
  "transform-merge-sibling-variables":       require("babel-plugin-transform-merge-sibling-variables"),
  "transform-minify-booleans":               require("babel-plugin-transform-minify-booleans"),
  "transform-undefined-to-void":             require("babel-plugin-transform-undefined-to-void"),
  "transform-remove-debugger":               require("babel-plugin-transform-remove-debugger"),
  "transform-remove-console":                require("babel-plugin-transform-remove-console"),
};

module.exports = preset;

function preset(_opts = {}) {
  const opts = isPlainObject(_opts) ? _opts : {};

  const plugins = [];

  const delegations = invertMap({
    keepFnames: [ "mangle", "deadcode" ],
  });

  option(opts, "evaluate", "minify-constant-folding", true);
  option(opts, "deadcode", "minify-dead-code-elimination", true);

  optionGroup(opts, "unsafe", (opts) => [
    option(opts, "flip", "minify-flip-comparisons", true),
    option(opts, "simplify", "transform-simplify-comparison-operators", true),
    option(opts, "guards", "minify-guarded-expressions", true),
    option(opts, "typeConstructors", "minify-type-constructors", true)
  ]);

  option(opts, "infinity", "minify-infinity", true);
  option(opts, "mangle", "minify-mangle-names", true);
  option(opts, "replace", "minify-replace", true);
  option(opts, "simplify", "minify-simplify", true);

  optionGroup(opts, "properties", (opts) => [
    option(opts, "memberExpressions", "transform-member-expression-literals", true),
    option(opts, "propertyLiterals", "transform-property-literals", true)
  ]);

  option(opts, "mergeVars", "transform-merge-sibling-variables", true);
  option(opts, "booleans", "transform-minify-booleans", true);

  option(opts, "undefinedToVoid", "transform-undefined-to-void", true);
  option(opts, "removeDebugger", "transform-remove-debugger", false);
  option(opts, "removeConsole", "transform-remove-console", false);

  return {
    minified: true,
    plugins,
  };

  function option(opts, name, plugin, defaultValue) {
    if (typeof opts === "undefined") {
      if (defaultValue) {
        plugins.push(getPlugin(name, plugin));
      }
    } else if (isPlainObject(opts) && hop(opts, name)) {
      if (isPlainObject(opts[name])) {
        plugins.push(getPlugin(name, plugin, opts[name]));
      } else if (opts[name]) {
        plugins.push(getPlugin(name, plugin));
      }
    } else if (defaultValue) {
      plugins.push(getPlugin(name, plugin));
    }
  }

  function optionGroup(opts, name, fn) {
    if (isPlainObject(opts) && (!hop(opts, name) || opts[name])) {
      fn(opts[name]);
    }
  }

  function getPlugin(name, plugin, pluginOpts) {
    const pluginFn = PLUGINS[plugin];
    if (hop(delegations, name)) {
      const delegatedOpts = {};
      delegations[name].forEach((d) => {
        if (hop(opts, d)) {
          Object.assign(delegatedOpts, {
            [d]: opts[d]
          });
        }
      });
      if (isPlainObject(pluginOpts)) {
        Object.assign(delegatedOpts, pluginOpts);
      }
      if (Object.keys(delegatedOpts).length > 0) {
        return [pluginFn, delegatedOpts];
      }
    }
    return pluginFn;
  }
}

function invertMap(map) {
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
