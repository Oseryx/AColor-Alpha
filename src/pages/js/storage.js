document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    
    document.getElementById('minimize').addEventListener('click', () => {
        ipcRenderer.send('minimizeStorage');
    }, false);
    document.getElementById('pin').addEventListener('click', () => {
        ipcRenderer.send('pinStorageWindow');
    }, false);
    document.getElementById('close').addEventListener('click', () => {
        ipcRenderer.send('hideStorage');
    }, false);
    
});