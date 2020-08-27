'use strict';

const { BrowserWindow } = require('electron');
const path = require('path');
const robot = require('robotjs');

let win;

let init = () => {
    if (win === null || win === undefined) createWindow();
    win.setPosition(robot.getMousePos().x - 50, robot.getMousePos().y - 50);
};

let createWindow = () => {
    win = new BrowserWindow({
        frame: false,
        autoHideMenuBar: true,
        width: 100,
        height: 100,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        focusable: true,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadURL(path.join(__dirname, "../pages/picker.html"));
    win.on('close', () => {
        win = undefined;
    });
};

let getWindow = () => win;

module.exports = {
    init: init,
    getWindow: getWindow
};