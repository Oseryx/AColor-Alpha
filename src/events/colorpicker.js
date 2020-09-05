'use strict';

const { ipcMain } = require('electron');

module.exports = (handlers) => {
    const { colorPicker, picker, storage, colorProperty, colorHarmony} = handlers;

    ipcMain.on('enableStorage', () => {
        storage.init();
    });

    ipcMain.on('enableHarmony', () => {
        colorHarmony.init();
    });

    ipcMain.on('minimizeColorPicker', () => {
        colorPicker.getWindow().minimize();
    });

    ipcMain.on('pinColorPickerWindow', () => {
        colorPicker.pinWindow();
    });

    ipcMain.on('hideColorPicker', () => {
        colorPicker.getWindow().hide();
    });

    ipcMain.on('toEdit', (event, color) => {
        colorPicker.getWindow().webContents.send('toEdit', color);
        colorPicker.getWindow().focus();
    });

    ipcMain.on('toAddToColorBook', (event, fileIndex) => {
        colorPicker.getWindow().webContents.send('toAddToColorBook', fileIndex);
        colorPicker.getWindow().focus();
    });
    ipcMain.on('updateColorPickerStorage', () => {
        if(colorPicker.getWindow()) colorPicker.getWindow().webContents.send('updateColorPickerStorage');
    });

}
