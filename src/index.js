const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const colorpicker = require('./handlers/colorpicker');
const handlers = require("./handlers")(__dirname);
const { colorPicker, picker, storage, colorProperty } = handlers;
const storageManager = require('./components/storage');
global.storage = storageManager;

require('./events')(handlers);

if (require('electron-squirrel-startup')) {
  app.quit();
}

app.allowRendererProcessReuse = false;

const lock = app.requestSingleInstanceLock();

if(!lock){
  app.quit();
}
else{

  app.on('second-instance', () => {
    if(colorPicker.getWindow()){
      if(!colorPicker.getWindow().isVisible()) colorPicker.getWindow().show();
      else if(colorPicker.getWindow().isMinimized()) colorPicker.getWindow().restore();

      colorPicker.getWindow().focus();
    }
  });

  app.on('ready', () =>  {
    colorPicker.init();
    systemTray();
    registerShortcuts();
  });
}


function systemTray() {
  let tray = null;
  app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, '../assets/img/color-picker.png'));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Color-Picker', click: () => {
          colorPicker.init();
        }
      },
      { label: 'Eye Dropper', click: () => {
        colorPicker.getWindow().webContents.send('enablePicker');
      } },
      { label: 'Settings' },
      {
        label: 'Quit', click: () => {
          app.quit();
        }
      }
    ]);
    tray.on('click', () => {
      colorPicker.init();
    });
    tray.setToolTip('Color Picker');
    tray.setContextMenu(contextMenu);
  });
}

function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    colorPicker.init();
  });
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    colorPicker.getWindow().webContents.send('enablePicker');
  });
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    app.quit();
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    colorPicker.init();
  }
});

app.on('window-all-closed', () => {
  return;
});
