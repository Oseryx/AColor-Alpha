document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    
    document.getElementById('minimize').addEventListener('click', () => {
        ipcRenderer.send('minimizeColorHarmony');
    }, false);
    document.getElementById('pin').addEventListener('click', () => {
        ipcRenderer.send('pinColorHarmony');
    }, false);
    document.getElementById('close').addEventListener('click', () => {
        ipcRenderer.send('hideColorHarmony');
    }, false);
    
});