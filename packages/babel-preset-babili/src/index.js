const isPlainObject = require("lodash.isplainobject");
const OptionsManager = require("./options-manager");

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

  // Proxies are options passed to multiple plugins
  const proxies = {
    keepFnames: ["mangle", "deadcode"]
  };

  const plugins = new OptionsManager(proxies, opts)
    .addOption("evaluate", PLUGINS["minify-constant-folding"], true)
    .addOption("deadcode", PLUGINS["minify-dead-code-elimination"], true)

    .addGroup("unsafe", (optionsManager) => {
      optionsManager
        .addOption("flip", PLUGINS["minify-flip-comparisons"], true)
        .addOption("simplify", PLUGINS["transform-simplify-comparison-operators"], true)
        .addOption("guards", PLUGINS["minify-guarded-expressions"], true)
        .addOption("typeConstructors", PLUGINS["minify-type-constructors"], true);
    })

    .addOption("infinity", PLUGINS["minify-infinity"], true)
    .addOption("mangle", PLUGINS["minify-mangle-names"], true)
    .addOption("replace", PLUGINS["minify-replace"], true)
    .addOption("simplify", PLUGINS["minify-simplify"], true)

    .addGroup("properties", (optionsManager) => {
      optionsManager
        .addOption("memberExpressions", PLUGINS["transform-member-expression-literals"], true)
        .addOption("propertyLiterals", PLUGINS["transform-property-literals"], true);
    })

    .addOption("mergeVars", PLUGINS["transform-merge-sibling-variables"], true)
    .addOption("booleans", PLUGINS["transform-minify-booleans"], true)

    .addOption("undefinedToVoid", PLUGINS["transform-undefined-to-void"], true)
    .addOption("removeDebugger", PLUGINS["transform-remove-debugger"], false)
    .addOption("removeConsole", PLUGINS["transform-remove-console"], false)

    .result;

  return {
    minified: true,
    plugins,
  };
}
