document.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    
    document.getElementById('eyedropper').addEventListener('click', () => {
        ipcRenderer.send('enablePicker', true);
    }, false);
    document.getElementById('harmony').addEventListener('click', () => {
        ipcRenderer.send('enableHarmony');
    }, false);
    document.getElementById('storage').addEventListener('click', () => {
        ipcRenderer.send('enableStorage');
    }, false);
    document.getElementById('minimize').addEventListener('click', () => {
        ipcRenderer.send('minimizeColorPicker');
    }, false);
    document.getElementById('pin').addEventListener('click', () => {
        ipcRenderer.send('pinColorPickerWindow');
    }, false);
    document.getElementById('close').addEventListener('click', () => {
        ipcRenderer.send('hideColorPicker');
    }, false);
});