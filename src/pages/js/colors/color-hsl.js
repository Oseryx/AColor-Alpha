const { ipcRenderer } = require('electron');
const clipbaord = require('copy-text-to-clipboard');
const range = document.getElementById('range');
const hiddentContext = range.getContext('2d');
const gradient = hiddentContext.createLinearGradient(0, 0, range.width, 0);

const hsvGradient = document.getElementById('preview');
const context = hsvGradient.getContext('2d');

hsvGradient.width = 255;
hsvGradient.height = 150;

const root = document.documentElement;

let circleX = hsvGradient.width - 5, circleY = 5;
let chosedColor;
let r, g, b, a = document.getElementById('alpha').value;
let pixel = hiddentContext.getImageData(0, 0, range.width, range.height).data;

let hasClickOnColorSelector = false;
let hasClickOnField = false;

let isEditingColor = false;

gradient.addColorStop(0, 'rgb(255, 0, 0)');
gradient.addColorStop(0.15, 'rgb(255, 255, 0)');
gradient.addColorStop(0.33, 'rgb(0, 255, 0)');
gradient.addColorStop(0.49, 'rgb(0, 255, 255)');
gradient.addColorStop(0.67, 'rgb(0, 0, 255)');
gradient.addColorStop(0.84, 'rgb(255, 0, 255)');
gradient.addColorStop(1, 'rgb(255, 0, 0)');
hiddentContext.fillStyle = gradient;
hiddentContext.fillRect(0, 0, range.width, range.height);


drawSwatch(pixel[0], pixel[1], pixel[2]);
setInputs([chosedColor[0], chosedColor[1], chosedColor[2], a]);

root.style.setProperty('--chosed-color', 'rgb(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + a + ')');

ipcRenderer.on('toEdit', (event, color) => {
    document.getElementById('actions').innerHTML = `
    <div class="edit-color-actions">
        <div class="update-color" id="update-color">
            <a>Save</a>
        </div>
    </div>
    <div class="cancel-actions" id="cancel-editing">
        <a>Cancel</a>
    </div>
    `;
    
    const rgba = hexToRgba(color);
    
    if(rgba !== undefined && rgba !== null){
        const rgba = hexToRgba(color);
        setInputs(rgba);
        document.getElementById('selector').style.setProperty('left', predictRangePos(rgba[0], rgba[1], rgba[2], range.width) - 7.5 + 'px');
        pixel = hiddentContext.getImageData(predictRangePos(rgba[0], rgba[1], rgba[2], range.width) - 7.5, 0, range.width, range.height).data;
        const [x, y] = predictCursorPos(rgba[0], rgba[1], rgba[2], hsvGradient.width, hsvGradient.height);
        circleX = x;
        circleY = y;
        drawSwatch(rgba[0], rgba[1], rgba[2]);
        
        refreshActiveColor(rgba[0], rgba[1], rgba[2], rgba[3]);
    }
    isEditingColor = true;
    
    document.getElementById('update-color').addEventListener('click', () => {
        if(isEditingColor) ipcRenderer.send('new-color', '#' + rgbaToHex(chosedColor[0], chosedColor[1], chosedColor[2], document.getElementById('alpha').value / 100));
        isEditingColor = false;
        document.getElementById('actions').innerHTML = `
        <div id="save-color-action" class="save-color">
            <a>Save</a>
        </div>
        `;
    });
    document.getElementById('cancel-editing').addEventListener('click', () => {
        if(isEditingColor) ipcRenderer.send('cancel-updating');
        isEditingColor = false;
        document.getElementById('actions').innerHTML = `
            <div id="save-color-action" class="save-color">
                <a>Save</a>
            </div>
            `;
        });
    });
    
    ipcRenderer.on('picked-color', (event, color) => {
        const rgba = hexToRgba(color);
        
        if(rgba !== undefined && rgba !== null){
            setInputs(rgba);
            predict(rgba);
            
            refreshActiveColor(rgba[0], rgba[1], rgba[2], rgba[3]);
        }
});

ipcRenderer.on('exit-editing', () => {
    isEditingColor = false;
    document.getElementById('actions').innerHTML = `
      <div id="save-color-action" class="save-color">
        <a>Save</a>
      </div>
    `;
});

ipcRenderer.on('enablePicker', () => {
    ipcRenderer.send('enablePicker', true);
});

//Cheked
hsvGradient.addEventListener('mousedown', (event) => {
    hasClickOnField = true;
    const bounds = hsvGradient.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    circleX = x;
    circleY = y;

    document.getElementsByTagName('body')[0].style.setProperty('cursor', (x === circleX && y === circleY)?'pointer':'default');

    drawSwatch(pixel[0], pixel[1], pixel[2]);
        
    a = document.getElementById('alpha').value;

    root.style.setProperty('--chosed-color', 'rgba(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + a / 100 + ')');
    const rgba = [chosedColor[0], chosedColor[1], chosedColor[2], a / 100];
    setInputs(rgba);
});

//Cheked
hsvGradient.addEventListener('mouseup', () => {
    hasClickOnField = false;
    document.getElementsByTagName('body')[0].style.setProperty('cursor', 'cursor');
});

//Cheked
document.addEventListener('mouseup', () => {
    if (hasClickOnField) hasClickOnField = false;
    if (hasClickOnColorSelector) hasClickOnColorSelector = false;
    document.getElementsByTagName('body')[0].style.setProperty('cursor', 'default');
});

//Cheked
document.addEventListener('mousemove', (e) => {
    if (hasClickOnField) {
        const bounds = hsvGradient.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;

        circleX = (x >= 0 && x <= hsvGradient.width) ? x : 
                  (x < 0) ? 0 : hsvGradient.width - 1;
        circleY = (y >= 0 && y <= hsvGradient.height) ? y : 
                  (y < 0) ? 0 : hsvGradient.height - 1;

        document.getElementsByTagName('body')[0].style.setProperty('cursor', (x === circleX && y === circleY)?'pointer':'default');

        drawSwatch(pixel[0], pixel[1], pixel[2]);
        
        a = document.getElementById('alpha').value;

        root.style.setProperty('--chosed-color', 'rgba(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + a / 100 + ')');
        const rgba = [chosedColor[0], chosedColor[1], chosedColor[2], a / 100];
        setInputs(rgba);
    }
    else if (hasClickOnColorSelector) {
        const bounds = range.getBoundingClientRect();
        const x = e.clientX - bounds.left;

        hasClickOnColorSelector = true;
        if (x > range.width) document.getElementById('selector').style.setProperty('left', range.width - 7.5 + 'px');
        else if (x < 0) document.getElementById('selector').style.setProperty('left', 0 - 7.5 + 'px');
        else document.getElementById('selector').style.setProperty('left', x - 7.5 + 'px');

        pixel = hiddentContext.getImageData(x, 0, range.width, range.height).data;
        
        drawSwatch(pixel[0], pixel[1], pixel[2]);

        root.style.setProperty('--chosed-color', 'rgba(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + a / 100 + ')');
        const rgba = [chosedColor[0], chosedColor[1], chosedColor[2], a / 100];
        setInputs(rgba);
    }
});

//Cheked
document.getElementById('range-container').addEventListener('mousedown', (event) => {
    hasClickOnColorSelector = true;
    if(hasClickOnColorSelector){
        const bounds = range.getBoundingClientRect();
        let x = event.clientX - bounds.left;

        x = (x <= range.width && x >= 0) ? x -7.5 : (x < 0) ? -7.5 : range.width - 7.5;
    
        pixel = hiddentContext.getImageData(x, 0, range.width, range.height).data;
        drawSwatch(pixel[0], pixel[1], pixel[2]);
    
        root.style.setProperty('--chosed-color', 'rgba(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + a / 100 + ')');
        const rgba = [chosedColor[0], chosedColor[1], chosedColor[2], document.getElementById('alpha').value / 100];
        setInputs(rgba);
        
        document.getElementById('selector').style.setProperty('left', x + 'px');
    }
});

//Cheked
range.addEventListener('mousemove', (e) => {
    if(hasClickOnColorSelector){
        const bounds = range.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        pixel = hiddentContext.getImageData(x, 0, range.width, range.height).data;
        drawSwatch(pixel[0], pixel[1], pixel[2]);
    }
});

//Cheked
range.addEventListener('mouseup', () => {
    hasClickOnColorSelector = false;
});

//Cheked
document.getElementById('alpha').addEventListener('input', () => {
    root.style.setProperty('--chosed-color', 'rgba(' + chosedColor[0] + ',' + chosedColor[1] + ',' + chosedColor[2] + ',' + Number(a) / 100 + ')');
    const rgba = [chosedColor[0], chosedColor[1], chosedColor[2], Number(document.getElementById('alpha').value / 100)];
    setInputs(rgba, 'alpha');
    refreshActiveColor(rgba[0], rgba[1], rgba[2], rgba[3]);
    editColor();
});

//Cheked
document.getElementById('hex').addEventListener('input', () => {
    let hex = document.getElementById('hex').value;
    const rgba = hexToRgba(hex);
    if(rgba !== undefined && rgba !== null){
        setInputs(rgba, 'hex');
        predict();
    }
});

//Checked
function drawSwatch(r, g, b) {
    context.clearRect(0, 0, hsvGradient.width, hsvGradient.height);

    const color = rgbToHsl(r, g, b);

    const saturation = context.createLinearGradient(1, 1, 1, hsvGradient.height - 1);
    const volume = context.createLinearGradient(1, 0, hsvGradient.width - 1, 0);

    saturation.addColorStop(0, 'white');
    saturation.addColorStop(1, 'black');
    
    volume.addColorStop(0, `hsla(${Math.floor(color[0])},100%,50%,0)`);
    volume.addColorStop(1, `hsla(${Math.floor(color[0])},100%,50%,1)`);

    context.fillStyle = saturation;
    context.fillRect(0, 0, hsvGradient.width, hsvGradient.height);
    context.fillStyle = volume;
    context.globalCompositeOperation = 'multiply';
    context.fillRect(0, 0, hsvGradient.width, hsvGradient.height);
    context.globalCompositeOperation = 'source-over';
    drawPicker(circleX, circleY);
}

//Checked but still some changes to do
function drawPicker(x, y) {
    context.beginPath();
    //To change
    context.strokeStyle = (y < 100 && x < 100) ? '#000' : '#fff';
    context.arc(x, y, 5, 0, 2 * Math.PI);
    hiddentContext.translate(x, y);
    context.stroke();
    chosedColor = context.getImageData(x, y, 1, 1).data;
    editColor();
}

//Checked
function resetInputs(){
    let alpha = document.getElementById('alpha').value / 100;
    document.getElementById('hex').value = '#' + rgbaToHex(chosedColor[0], chosedColor[1], chosedColor[2], alpha);
}

//Nothing to change
function refreshActiveColor(r, g, b, a){
    root.style.setProperty('--chosed-color', 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')');
}

function editColor() {
    if(isEditingColor) ipcRenderer.send('update-color', '#' + rgbaToHex(chosedColor[0], chosedColor[1], chosedColor[2], document.getElementById('alpha').value / 100));
}

function setInputs(rgba, except){
    if(except !== 'alpha') document.getElementById('alpha').value = rgba[3] * 100;
    document.getElementById('transparency').innerHTML = ('Opacity: ' + rgba[3]);

    if(except !=='hex') document.getElementById('hex').value = '#' + rgbaToHex(rgba[0], rgba[1], rgba[2], rgba[3]);
    if(except !=='rgb') document.getElementById('rgb').value = generateInputText('rgb', rgba, rgba[3]);
    if(except !=='hsl') document.getElementById('hsl').value = generateInputText('hsl', rgbToHsl(rgba[0], rgba[1], rgba[2]), rgba[3]);
    if(except !=='hsv') document.getElementById('hsv').value = generateInputText('hsv', rgbToHsv(rgba[0], rgba[1], rgba[2]), rgba[3]);
}

document.getElementById('rgb').addEventListener('input', () => {
    const value = document.getElementById('rgb').value;
    const rgba = filterInput(value, 'rgb');

    setInputs(rgba, 'rgb');
    predict(rgba);
});

document.getElementById('hsv').addEventListener('input', () => {
    const value = document.getElementById('hsv').value;
    const hsv = filterInput(value, 'hsv');
    const rgba = hsvToRgb(hsv[0], hsv[1], hsv[2], hsv[3]);

    setInputs(rgba, 'hsv');
    predict(rgba);
});

document.getElementById('hsl').addEventListener('input', () => {
    const value = document.getElementById('hsl').value;
    const hsl = filterInput(value, 'hsl');
    const rgba = hslToRgb(hsl[0], hsl[1], hsl[2], hsl[3]);

    setInputs(rgba, 'hsl');
    predict(rgba);
});

// ----------------------------------------------------------//
//                                                           //
// ----------------------------------------------------------//

document.getElementById('rgb').addEventListener('change', () => {
    const value = document.getElementById('rgb');
    const values = filterInput(value.value, 'rgb');
    value.value = generateInputText('rgb', values, values[3]);
});

document.getElementById('hsl').addEventListener('change', () => {
    const value = document.getElementById('hsl');
    const values = filterInput(value.value, 'hsl');
    value.value = generateInputText('hsl', values, values[3]);
});

document.getElementById('hsv').addEventListener('change', () => {
    const value = document.getElementById('hsv');
    const values = filterInput(value.value, 'hsv');
    value.value = generateInputText('hsv', values, values[3]);
});

function predict(rgba){
    const rangePosX =  predictRangePos(rgba[0], rgba[1], rgba[2], range.width) - 7.5;
    document.getElementById('selector').style.setProperty('left', rangePosX + 'px');
    pixel = hiddentContext.getImageData(rangePosX, 0, range.width, range.height).data;

    const [x, y] = predictCursorPos(rgba[0], rgba[1], rgba[2], hsvGradient.width, hsvGradient.height);
    circleX = x;
    circleY = y;
    drawSwatch(rgba[0], rgba[1], rgba[2]);

    refreshActiveColor(rgba[0], rgba[1], rgba[2], rgba[3]);
}

for(let i = 0; i < document.getElementsByClassName('clipboard').length; i++){
    const clip = document.getElementsByClassName('clipboard')[i];
    clip.addEventListener('click', () => {
        if(i === 0) clipbaord(document.getElementById('hex').value);
        else if(i === 1) clipbaord(document.getElementById('rgb').value);
        else if(i === 2) clipbaord(document.getElementById('hsl').value);
        else if(i === 3) clipbaord(document.getElementById('hsv').value);

        clip.classList.toggle('copied');
        setTimeout(() => {
            clip.classList.toggle('copied');
        }, 1000);
    });
}