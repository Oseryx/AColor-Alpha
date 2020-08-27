'use strict';

const { BrowserWindow } = require('electron');
const path = require('path');

let win;
let isOnTop = false;

let init = () => {
    if (win === null || win === undefined) createWindow();
    else win.show();
};

let createWindow = () => {
    win = new BrowserWindow({
        frame: false,
        width: 700,
        height: 300,
        focusable: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    win.loadURL(path.join(__dirname, "../pages/color-property.html"));
    win.webContents.openDevTools();

    win.on('close', () => {
        win = undefined;
    });

    //win.webContents.send('targetColor', file, color);
};

let getWindow = () => win;

let pinWindow = () => {
    isOnTop = (isOnTop) ? false : true;
    win.setAlwaysOnTop(isOnTop, 'screen');
};

module.exports = {
    init: init,
    getWindow: getWindow,
    pinWindow: pinWindow
};