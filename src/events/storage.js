"use strict";

const { ipcMain, ipcRenderer } = require('electron');

module.exports = (handlers) => {
    const { colorPicker, picker, storage, colorProperty } = handlers;

    let closeStorage = () => {
        if (picker.getWindow()) {
            ipcMain.removeListener('closeStorage', closeStorage);
            ipcMain.removeListener('minimizeStorage', () => { });
            picker.getWindow().hide();
        }
    }

    ipcMain.on('minimizeStorage', () => {
        storage.getWindow().minimize();
    });

    ipcMain.on('pinStorageWindow', () => {
        storage.pinWindow();
    });

    ipcMain.on('hideStorage', () => {
        storage.getWindow().hide();
    });

    ipcMain.on('enableColorProperty', (event, file, color) => {
        if(!colorProperty.getWindow()){
            colorProperty.init();
            colorProperty.getWindow().webContents.on('did-finish-load', () => {
                if(colorProperty.getWindow()) colorProperty.getWindow().webContents.send('targetColor', file, color);
            });
        }
        else{
            colorProperty.getWindow().webContents.send('targetColor', file, color);
            colorProperty.getWindow().focus();
        }
    });

    ipcMain.on('refreshCurrentFile', () => {
        storage.getWindow().webContents.send('refreshRequired');
    });

    ipcMain.on('updateStorageWindow', () => {
        if(storage.getWindow()) storage.getWindow().webContents.send('updateStorage');
    });

}