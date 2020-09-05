"use strict";

module.exports = (handlers) => ({
    picker: require("./picker")(handlers),
    colorPicker: require("./colorpicker")(handlers),
    storage: require('./storage')(handlers),
    colorProperty: require('./color-property')(handlers),
    colorHarmony: require('./color-harmony')(handlers)
});