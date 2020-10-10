"use strict";

const { ipcMain } = require('electron');

module.exports = (handlers) => {
    const { colorPicker, picker, storage, colorProperty } = handlers;

    ipcMain.on('minimizeColorProperty', () => {
        colorProperty.getWindow().minimize();
    });

    ipcMain.on('pinColorPropertyWindow', () => {
        colorProperty.pinWindow();
    });

    ipcMain.on('closeColorProperty', () => {
        colorProperty.getWindow().close();
        colorPicker.getWindow().webContents.send('exit-editing');
    });

    ipcMain.on('update-color', (event, color) => {
        if(colorProperty.getWindow()) colorProperty.getWindow().webContents.send('update-color', color);
        else {
            if(colorPicker.getWindow()) colorPicker.getWindow().webContents.send('exit-editing');
        }
    });

    ipcMain.on('new-color', (event, color) => {
        colorProperty.getWindow().webContents.send('newColor', color);
    });

    ipcMain.on('cancel-updating', () => {
        colorProperty.getWindow().webContents.send('cancel-updating');
    });

}