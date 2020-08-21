const { ipcRenderer } = require('electron');

document.querySelector("#picker").style.border = "10px solid rgba(200, 200, 200, 0.3)";

//document.addEventListener('DOMContentLoaded', () => ipcRenderer.send('enablePicker'), false);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') ipcRenderer.send('closePicker');
}, false);

ipcRenderer.on('updatePicker', (event, color) => {
    document.getElementById("picker").style.border = `10px solid ${color}`;
});