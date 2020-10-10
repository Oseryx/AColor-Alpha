const { ipcRenderer } = require('electron');
//const fs = require('fs');
const remote = require('electron').remote;
const storage = remote.getGlobal('storage');
const clipboard = require('copy-text-to-clipboard');

let mainColor;
let alpha = 1;
let pickedColor;
let isMenuOpen = false;

let folder;
let colorIndex;

let targetGradientIndex = -1;

document.getElementById('minimize').addEventListener('click', () => {
    ipcRenderer.send('minimizeColorProperty');
}, false);
    
document.getElementById('pin').addEventListener('click', () => {
    ipcRenderer.send('pinColorPropertyWindow');
}, false);
    
document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('closeColorProperty');
}, false);

document.getElementById('eyedropper').addEventListener('click', () => {
    ipcRenderer.send('enablePicker', false);
});

document.getElementById('chromatic').addEventListener('click', () => {
    ipcRenderer.send('toEdit', mainColor);
});

document.getElementById('body').addEventListener('mousedown', (event) => {
    const menu = document.getElementById('menu');
    if(!(event.target === menu || menu.contains(event.target))) hideMenu();
});

document.getElementById('replace-by-picked').addEventListener('click', () => {
    document.getElementById('color-pick').classList.toggle('hide-pick-popup');
    document.getElementById('preview').style.setProperty('background', pickedColor);
    
    setValues(pickedColor);
    
    const convertedColor = hexToRgba(pickedColor);
    generateVariants(convertedColor);

    storage.updateColor(folder, colorIndex, pickedColor);
    ipcRenderer.send('refreshCurrentFile');
    //replaceColor(pickedColor);
});

document.getElementById('add-color').addEventListener('click', () => {
    document.getElementById('color-pick').classList.toggle('hide-pick-popup');
    document.getElementById('color-popup').classList.toggle('hide-new-color-popup');

    mainColor = storage.getColor(folder, colorIndex).color.colorHex;

    const convertedColor = hexToRgba(mainColor);
    generateVariants(convertedColor);

    setValues(mainColor);
});

document.getElementById('cancel-pick').addEventListener('click', () => {
    document.getElementById('color-pick').classList.toggle('hide-pick-popup');
   
    mainColor = storage.getColor(folder, colorIndex).color.colorHex;

    const convertedColor = hexToRgba(mainColor);
    generateVariants(convertedColor);

    setValues(mainColor);
});

document.getElementById('add-color-name-btn').addEventListener('click', () => {
    document.getElementById('color-popup').classList.toggle('hide-new-color-popup');

    const colorName = document.getElementById('new-color-name').value;
    storage.addColor(folder, colorName, pickedColor);
    ipcRenderer.send('refreshCurrentFile');
    //(colorName, pickedColor);
});

document.getElementById('cancel-new-color').addEventListener('click', () => {
    document.getElementById('color-popup').classList.toggle('hide-new-color-popup');
});

/* RIGHT CLICK MENU */ 
document.getElementById('replace').addEventListener('click', () => {
    pickedColor = document.getElementsByClassName('variant')[targetGradientIndex].style.background;
    document.getElementById('replace-actual-color').classList.toggle('hide-replace-actual-color');
    hideMenu();
    document.getElementById('replace-gradient').style.background = pickedColor;
});

document.getElementById('add').addEventListener('click', () => {
    const rgba = stringToRgba(document.getElementsByClassName('variant')[targetGradientIndex].style.background);
    pickedColor = '#' + rgbaToHex(rgba[0], rgba[1], rgba[2]);
    document.getElementById('color-popup').classList.toggle('hide-new-color-popup');
});

/* replace button menu for variants */
document.getElementById('replace-color-gradient').addEventListener('click', () => {
    document.getElementById('replace-actual-color').classList.toggle('hide-replace-actual-color');
    const rgba = stringToRgba(pickedColor);
    const hex = '#' + rgbaToHex(rgba[0], rgba[1], rgba[2], 1);
    storage.updateColor(folder, colorIndex, hex);
    ipcRenderer.send('refreshCurrentFile');
    //replaceColor(hex);
    setValues(hex);
    generateVariants(hexToRgba(hex));
});

/* Dropdown list hex rgba hsl hsv */
document.getElementById('color-mode').addEventListener('change', () => {
    const value = Number(document.getElementById('color-mode').value);
    
    const rgb = hexToRgba(mainColor)
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2], alpha);
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2], alpha);

    document.getElementById('color-value').style.setProperty('font-size', '12px');

    let colorPropertyText = '';

    if(value === 0) colorPropertyText = mainColor;
    else if(value === 1) colorPropertyText = generateInputText('rgb', rgb, alpha);
    else if(value === 2) colorPropertyText = generateInputText('hsl', hsl, hsl[3]);
    else if(value === 3) colorPropertyText = generateInputText('hsv', hsv, hsv[3]);

    document.getElementById('color-value').innerHTML = colorPropertyText;

    if(colorPropertyText.length >= 20) document.getElementById('color-value').style.setProperty('font-size', '9px');
    else document.getElementById('color-value').style.setProperty('font-size', '12px');
    
});

document.getElementById('cancel-replace-gradient').addEventListener('click', () => {
    document.getElementById('replace-actual-color').classList.toggle('hide-replace-actual-color');
});

//Copy to clipboard
const colorContainer = document.getElementById('color-value-container');
colorContainer.addEventListener('click', () => {
    const colorInfo = document.getElementById('color-value').innerHTML;
    clipboard(colorInfo);
    colorContainer.classList.toggle('clipboard');
    setTimeout(() => {
        colorContainer.classList.toggle('clipboard');
    }, 1000);
});

ipcRenderer.on('targetColor', (event, file, color) => {
    const convertedColor = hexToRgba(storage.getColor(file, color).color.colorHex);
    const targetColor = storage.getColor(file, color);
    
    folder = file;
    colorIndex = color;
    mainColor = targetColor.color.colorHex;
    
    generateVariants(convertedColor);
    setValues(targetColor.color.colorHex);
    setNames(targetColor);

    if(convertedColor[3]) alpha = convertedColor[3];
});

ipcRenderer.on('newColor', (event, color) => {
    document.getElementById('color-pick').classList.toggle('hide-pick-popup');
    pickedColor = color;
    document.getElementById('picked-color').style.background = color;
});

ipcRenderer.on('update-color', (event, color) => {
    const rgb = hexToRgba(color);
    generateVariants(rgb);
    setValues(color);
});

ipcRenderer.on('cancel-updating', () => {
    mainColor = storage.getColor(folder, colorIndex).color.colorHex;

    const rgb = hexToRgba(mainColor);
    generateVariants(rgb);
    setValues(mainColor);
});

function setValues(color){
    document.getElementById('color-mode').selectedIndex = 0;
    document.getElementById('preview').style.setProperty('background', color);
    document.getElementById('color-value').innerHTML = color;
    mainColor = color;
}

function setNames(names){
    document.getElementById('color-name').innerHTML = names.color.colorName;
    document.getElementById('book-name').innerHTML = names.book.bookName;
}

function generateVariants(color){
    //Tints
    const [numShades, numTints] = calculateGradients(color[0], color[1], color[2]);
    const tints = calculateTints(color[0], color[1], color[2], numTints);
    const shades = calculateShading(color[0], color[1], color[2], numShades);

    const gradient = document.getElementById('gradients');

    let gradients = ``;
    for(let i = tints.length - 1; i >= 0; i--){
        gradients += `<div class="variant-background">
            <div class="variant" style="background: rgba(` + tints[i][0] + `,` + tints[i][1] + `,` + tints[i][2] + ',' + color[3] +`)"></div>
        </div>`;
    }

    for(let i = 0; i < shades.length; i++){
        gradients += `<div class="variant-background">
            <div class="variant" style="background: rgba(` + shades[i][0] + `,` + shades[i][1] + `,` + shades[i][2] + ',' + color[3] +`)"></div>
        </div>`;
    }

    gradient.innerHTML = gradients;
    setVariantsInputs();
}

function setVariantsInputs(){
    const variants = document.getElementsByClassName('variant').length;
    const menu = document.getElementById('menu');

    for(let i = 0; i < variants; i++){
        document.getElementsByClassName('variant')[i].addEventListener('contextmenu', (event) => {
            const bound = document.getElementById('body').getBoundingClientRect();
            let x = event.clientX - bound.left;
            let y = event.clientY - bound.top;
            menu.classList.toggle('hide-menu'); 

            x = (x + 125 > 300) ? x - 125 : x;
            y = (y + 50 > 300) ? y - 50 : y;

            menu.style.top = y + 'px';
            menu.style.left = x + 'px';
            isMenuOpen = true;
            targetGradientIndex = i;
        });
        document.getElementsByClassName('variant')[i].addEventListener('click', () => {
            hideMenu();
        });
    }
}

function hideMenu(){
    if(isMenuOpen){
        const menu = document.getElementById('menu');
        if(!menu.classList.contains('hide-menu')) menu.classList.toggle('hide-menu');
        isMenuOpen = false;
    }
}