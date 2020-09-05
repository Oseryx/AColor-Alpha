'use strict';

const { ipcMain } = require('electron');

module.exports = (handlers) => {
    const { colorPicker, picker, storage, colorProperty, colorHarmony } = handlers;

    ipcMain.on('minimizeColorHarmony', () => {
        colorHarmony.getWindow().minimize();
    });

    ipcMain.on('pinColorHarmony', () => {
        colorHarmony.pinWindow();
    });

    ipcMain.on('hideColorHarmony', () => {
        colorHarmony.getWindow().hide();
    });

}