'use strict';

require('robotjs');
module.exports = () => ({
    colorPicker: require("./colorpicker"),
    picker: require("./picker"),
    storage: require('./storage'),
    colorProperty: require('./color-property'),
    colorHarmony: require('./color-harmony')
});