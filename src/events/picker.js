"use strict";

const { ipcMain } = require('electron');
const robot = require('robotjs');

let mouseEvent;
let pickerClosed = false;

module.exports = (handlers) => {
    const { colorPicker, picker, storage, colorProperty } = handlers;

    let closePicker = () => {
        if (picker.getWindow()) {
            pickerClosed = true;
            ipcMain.removeListener('closePicker', closePicker);
            ipcMain.removeListener('enablePicker', event => { });
            picker.getWindow().close();
        }
    }

    const linuxMouse = () => {
        const ioHook = require('iohook');

        ioHook.start();

        ioHook.on('mousemove', event => {
            if(!picker.getWindow()) return
            let realtime = storage.get('realtime', 'picker')
            let {x, y} = event;
            let color = '#' + robot.getPixelColor(parseInt(x), parseInt(y))
            picker.getWindow().setPosition(parseInt(x) - 50, parseInt(y) - 50)
            picker.getWindow().webContents.send('updatePicker', color)
            if (realtime) colorpicker.getWindow().webContents.send('previewColor', color)
        })

        ioHook.on('mouseup', event => {
            if(!picker.getWindow()) return
            if(event.button == 2) return closePicker();
            let {x, y} = event;
            closePicker('#' + robot.getPixelColor(parseInt(x), parseInt(y)))
        })

        let pos = robot.getMousePos();
        picker.getWindow().setPosition(parseInt(pos.x) - 50, parseInt(pos.y) - 50);

        picker.getWindow().webContents.send(
                'updatePicker',
                robot.getPixelColor(pos.x, pos.y)
            );

        ipcMain.on('closePicker', closePicker);
    }

    const hideWindows = () => {
        if(colorPicker.getWindow() && colorPicker.getWindow().isVisible()) colorPicker.getWindow().hide();
        if(storage.getWindow() && storage.getWindow().isVisible()) storage.getWindow().hide();
        if(colorProperty.getWindow() && colorProperty.getWindow().isVisible()) colorProperty.getWindow().hide();
    }

    const showWindows = () => {
        if(colorPicker.getWindow() && !colorPicker.getWindow().isVisible()) colorPicker.getWindow().show();
        if(storage.getWindow() && !storage.getWindow().isVisible()) storage.getWindow().show();
        if(colorProperty.getWindow() && !colorProperty.getWindow().isVisible()) colorProperty.getWindow().show();
    }

    ipcMain.on('enablePicker', (event, sendToColorPicker) => {
        pickerClosed = false;
        hideWindows();
        if(!picker.getWindow()) picker.init();
        if(process.platform !== 'win32' && process.platform !== 'darwin') return linuxMouse();
        if (process.platform === 'win32') mouseEvent = require('win-mouse')();
        picker.getWindow().on('close', () => mouseEvent.destroy());
        
        mouseEvent.on('move', (x, y) => {
            if(picker.getWindow()){
                let color = "#" + robot.getPixelColor(parseInt(x), parseInt(y));
                picker.getWindow().setPosition(parseInt(x) - 50, parseInt(y) - 50);
                picker.getWindow().webContents.send('updatePicker', color);
                let mousePos = robot.getMousePos();
                picker.getWindow().setPosition(parseInt(mousePos.x) - 50, parseInt(mousePos.y) - 50);
            }
        });

        ipcMain.on('closePicker', () => {
            closePicker();
            showWindows();
        });
        
        mouseEvent.once('left-down', (x, y) => {
            if(sendToColorPicker){
                const color = "#" + robot.getPixelColor(parseInt(x), parseInt(y));
                
                if(!colorPicker.getWindow()) colorPicker.init();
                
                showWindows();
                closePicker();
    
                colorPicker.getWindow().webContents.send('picked-color', color);
                colorPicker.getWindow().focus();
    
                pickerClosed = false;
            }
            else{
                if(!pickerClosed){
                    const color = '#' + robot.getPixelColor(parseInt(x), parseInt(y));
                    colorProperty.getWindow().webContents.send('newColor', color);
                    mouseEvent.destroy();
                    showWindows();
                    closePicker();
                }
            }
        });
    });
}
