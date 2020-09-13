const { property } = require("lodash");

function rgbToXyz(r, g, b){
    r = r / 255;
    g = g / 255;
    b = b / 255;

    if (r > 0.04045) r = Math.pow((r + 0.055) / 1.055, 2.4);
    else r = r / 12.92;
    if (g > 0.04045) g = Math.pow((g + 0.055) / 1.055, 2.4);
    else g = g / 12.92;
    if (b > 0.04045) b = Math.pow((b + 0.055) / 1.055, 2.4);
    else b = b / 12.92;

    r = r * 100;
    g = g * 100;
    b = b * 100;

    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    return [x.toFixed(4), y.toFixed(4), z.toFixed(4)];
}

function xyzToRgb(x, y, z){
    x = x / 100;
    y = y / 100;
    z = z / 100;

    
    let r = (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293);
	let g = (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175);
	let b = (x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878);

    if (r > 0.0031308) r = (1.055 * Math.pow(r, (1 / 2.4)))- 0.055;
    else r = 12.92 * r;
    if (g > 0.0031308) g = (1.055 * Math.pow(g, (1 / 2.4))) - 0.055;
    else g = 12.92 * g;
    if (b > 0.0031308) b = (1.055 * Math.pow(b, (1 / 2.4))) - 0.055;
    else b = 12.92 * b;

    r = r * 255;
    g = g * 255;
    b = b * 255;

    return [r.toFixed(0), g.toFixed(0), b.toFixed(0), 1];
}

function rgbToCmyk(r, g, b){
    r = r / 255;
    g = g / 255;
    b = b / 255;

    let k = Math.min(1 - r, 1 - g, 1 - b);
    let c = (1 - r - k) / (1 - k);
    let m = (1 - g - k) / (1 - k);
    let y = (1 - b - k) / (1 - k);
    
    c = (isNaN(c)) ? 0 : Math.round(c * 100);
    m = (isNaN(m)) ? 0 : Math.round(m * 100);
    y = (isNaN(y)) ? 0 : Math.round(y * 100);
    k = (isNaN(k)) ? 0 : Math.round(k * 100);

    return [c, m, y, k];
}

function cmykToRgb(c, m, y, k){
    c = c / 100;
    m = m / 100;
    y = y / 100;
    k = k / 100;

    let r = 1 - Math.min(1, c * (1 - k) + k);
    let g = 1 - Math.min(1, m * (1 - k) + k);
    let b = 1 - Math.min(1, y * (1 - k) + k);

    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);

    return [r, g, b, 1];
}

function rgbToHsl(r, g, b, alpha) {
    let hsl = {};
    r /= 255, g /= 255, b /= 255;
  
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
      switch (max) {
        case r: h = (g - b) / d; break;
        case g: h = 2 + ((b - r) / d); break;
        case b: h = 4 + ((r - g) / d); break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    return [
        Number(h.toFixed(0)),
        Number(Math.round(s * 100).toFixed(0)),
        Number(Math.round(l * 100).toFixed(0)),
        alpha
    ];
  }

//Cheked
function rgbaToHex(r, g, b, a) {
    const rgba = [r, g, b, a];
    let hex = '';

    for (let value of rgba) {
        //if the color property is a (alpha) then convert it's value from [0-1] to [0-255]
        if((a < 0 || Number(a) != a || a >= 1) && value === a) return hex;
        if(value === a) value = Math.floor(a * 255);

        //Check if value is an integer
        if(!isInt(value)) value = Math.floor(Number(value) / 1);

        const digit = Number(value).toString(16);
        hex += (digit.length < 2) ? '0' + digit : digit;
    }

    return hex;
}

//Checked
function hexToRgba(hex){

    let r, g, b, a;
    //Remove the #
    hex = hex.substr(1);
    
    //convert rgb to rrggbb and rgba to rrggbbaa format
    if(hex.length <= 4){
        const newR = hex.slice(0, 1);
        const newG = hex.slice(1, 2);
        const newB = hex.slice(2, 3);
        const newA = (hex.length === 4) ? hex.slice(3, 4) : undefined;
        
        hex = newR + newR + newG + newG + newB + newB;
        hex = (newA) ? hex + newA + newA : hex;
    }
    
    //convert hex to rgb
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = Number((hex.length === 8) ? (parseInt(hex.slice(6, 8), 16) / 255) : 1);
    
    //filter potential error if r g b a are unefined and return the correct output
    r = (r === undefined || isNaN(r)) ? 0 : r;
    g = (g === undefined || isNaN(g)) ? 0 : g;
    b = (b === undefined || isNaN(b)) ? 0 : b;
    a = (a !== undefined) ? 
        ((isInt(a)) ?  a.toFixed(0) :  a.toFixed(2)) 
        : 1;
    return [r, g, b, a];
}

//Cheked: To delete
function stringToRgba(color){
    const numComma = color.split(',').length - 1;
    let colorConverted = [];
    
    if(numComma === 2){
        color = color.substr(4);
        color = color.slice(0, -1);

        const rgb = color.split(',');
        
        for(let primaryColor of rgb){
            if(isNaN(Number(primaryColor))) return 'error';
            
            colorConverted.push(Number(primaryColor));
        }
        
        return (filterConversion(colorConverted)) ? colorConverted : 'error';
    }
    else if(numComma === 3){
        color = color.substr(5);
        color = color.slice(0, -1);
        
        const rgb = color.split(',');

        //check if user set an alpha in rgb() and not rgba()
        if(isInt(Number(rgb[4]))) return 'error';
        
        
        for(let primaryColor of rgb){
            if(isNaN(Number(primaryColor))) return 'error';
            
            colorConverted.push(Number(primaryColor));
        }
        
        return (filterConversion(colorConverted)) ? colorConverted : 'error';
    }

    return 'error';
}

//Checked
//Check if r g b are integer and are between 0-255 and alpha is between 0-1
function filterConversion(rgba){
    for(let i = 0; i < rgba.length; i++){
        if(i === 3){
            if(rgba[i] < 0 || rgba[i] > 1) return false;
        }
        else{
            if(!isInt(rgba[i]) && rgba[i] < 0 && rgba[i] > 255) return false;
        }
    }
    return true;
}

//Cheked
function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

//Cheked
function calculateHue(r, g, b){
    let hue;

    [r, g, b] = [limit(r, 0, 255) / 255, limit(g, 0, 255) / 255, limit(b, 0, 255) / 255];

    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    
    if (min === max) {
        hue = 0;
    } else {
        const dif = max - min;
        switch (max) {
            case r:
                hue = (g - b) / dif;
                break;
            case g:
                hue = 2 + ((b - r) / dif);
                break;
            case b:
                hue = 4 + ((r - g) / dif);
                break;
        }

        hue *= 60;
        if (hue < 0) hue += 360;
    }

    return hue.toFixed(0);
}

//To edit
function rgbToHsv(r, g, b, alpha) {
    [r, g, b] = [limit(r, 0, 255) / 255, limit(g, 0, 255) / 255, limit(b, 0, 255) / 255];
    const max = Math.max(r, g, b),
          min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if(max == min) {
        h = 0;
    } else {
        switch(max) {
            case r: h = (g - b) / d; break;
            case g: h = 2 + ((b - r) / d); break;
            case b: h = 4 + ((r - g) / d); break;
        }
        h *= 60;
        if (h < 0) h += 360;
    }
    h = Number(h.toFixed(0));
    s = Number((s * 100).toFixed(0));
    v = Number((v * 100).toFixed(0));
    
    return [h, s, v, alpha];
}

function hsvToRgb(hue, saturation, volume, alpha) {
    saturation /= 100;
    volume /= 100;
    let chroma = volume * saturation;
    hue /= 60;
    let x = chroma * (1- Math.abs((hue % 2) - 1));
    let r1, g1, b1;

    if (hue >= 0 && hue <= 1) {
      ([r1, g1, b1] = [chroma, x, 0]);
    } else if (hue >= 1 && hue <= 2) {
      ([r1, g1, b1] = [x, chroma, 0]);
    } else if (hue >= 2 && hue <= 3) {
      ([r1, g1, b1] = [0, chroma, x]);
    } else if (hue >= 3 && hue <= 4) {
      ([r1, g1, b1] = [0, x, chroma]);
    } else if (hue >= 4 && hue <= 5) {
      ([r1, g1, b1] = [x, 0, chroma]);
    } else if (hue >= 5 && hue <= 6) {
      ([r1, g1, b1] = [chroma, 0, x]);
    }
    
    let m = volume - chroma;
    let [r,g,b] = [r1+m, g1+m, b1+m];
     
    return [
        Math.round(r * 255), 
        Math.round(g * 255), 
        Math.round(b * 255),
        alpha
    ];
}

function hslToRgb(h, s, l, alpha){
    s /= 100;
    l /= 100;
  
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;
    
    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [r, g, b, alpha];
}

//Cheked
function limit(value, min, max) {
    value = +value;
    return isNaN(value) ? min : (value < min ? min : (value > max ? max : value));
}

//Cheked
function predictRangePos(r, g, b, width){
    return width * (calculateHue(r, g, b) / 360);
}

//Cheked
function predictCursorPos(r, g, b, width, height){
    const [, s, v] = rgbToHsv(r, g, b);
    const x = width * (s / 100);
    const y = height - (height * (v / 100));

    return[x, y];
}

function calculateShading(r, g, b, maxFactor){
    let shades = [];

    for(let i = 1; i <= maxFactor; i++){
        const newR = r * (1 - i / maxFactor);
        const newG = g * (1 - i / maxFactor);
        const newB = b * (1 - i / maxFactor);

        shades.push([Math.floor(newR), Math.floor(newG), Math.floor(newB)]);
    }

    return shades;
}

function calculateTints(r, g, b, maxFactor){
    let tints = [];

    for(let i = 1; i <= maxFactor; i++){
        const newR = r + (255 - r) * (i / maxFactor);
        const newG = g + (255 - g) * (i / maxFactor);
        const newB = b + (255 - b) * (i / maxFactor);

        tints.push([Math.floor(newR), Math.floor(newG), Math.floor(newB)]);
    }

    return tints;
}

function filterInput(value, type){
    let filterResult = '';

    for(const letter of value){
        filterResult += (letter === ' ' || Number(letter) == letter || letter === '.') ? letter: ' ';
    }

    let numbers = [];
    const filterList = filterResult.split(' ');

    for(const element of filterList){
        if(element != '' && element != '.') numbers.push(Number(element));
    }

    numbers = checkNumbers(numbers.slice(0, 4), type);
    numbers = validateInputs(numbers, type);
    
    return numbers;
}

function checkNumbers(properties, type){
    for(let i = 0; i < 3; i++){
        if(!properties[i]) properties.push(0);
        else properties[i] = Number(properties[i].toFixed(0));
    }

    if(type !== 'cmyk'){
        if(!properties[3] && properties[3] !== 0) properties.push(1);
        else if (properties[3] > 1 || properties[3] < 0) properties[3] = 1;
        else properties[3] = Number(properties[3].toFixed(2));    
    }
    else if(!properties[3]) properties.push(0);

    return properties;
}

function validateInputs(properties, type){
    if(type === 'rgb'){
        for(let i = 0; i < 3; i++){
            if(properties[i] > 255 || properties[i] < 0) properties[i] = 255;
        }
        return properties;
    }
    else if(type === 'hsv' || type === 'hsl'){
        if(properties[0] > 360 || properties[0] < 0) properties[0] = 0;
        for(let i = 1; i < 3; i++){
            if(properties[i] > 100 || properties[i] < 0) properties[i] = 0;
        }
        return properties;
    }
    else if(type === 'cmyk'){
        for(let i = 0; i < 4; i++){
            if(properties[i] > 100 || properties[i] < 0) properties[i] = 0;
        }
        return properties;
    }
    else if(type === 'xyz'){
        for(let i = 0; i < 3; i++){
            if(properties[i] < 0 || properties[i] > 109) properties[i] = 0;
        }
        return properties;
    }
}

function generateInputText(type, values, a){
    let alpha = (a < 1) ? (', ' + a) : '';
    let inputText = '';

    let header = '';
    let body = '';

    switch(type){
        case 'rgb':
            header = (alpha != '') ? 'rgba' : 'rgb';
            body = '(' + values[0] + ', ' + values[1] + ', ' + values[2] + alpha + ')';
            inputText = header + body;
            break;
        case 'hsl':
            header = (alpha != '') ? 'hsla' : 'hsl';
            body = '(' + values[0] + '°, ' + values[1] + '%, ' + values[2] + '%' + alpha + ')';
            inputText = header + body;
            break;
        case 'hsv':
            header = (alpha != '') ? 'hsva' : 'hsv';
            body = '(' + values[0] + '°, ' + values[1] + '%, ' + values[2] + '%' + alpha + ')';
            inputText = header + body;
            break;
        case 'cmyk':
            inputText = 'CMYK(' + values[0] + '%, ' + values[1] + '%, ' + values[2] + '%, ' + values[3] + '%)';
            break;
        case 'xyz':
            inputText = 'xyz(' + values[0] + ', ' + values[1] + ', ' + values[2] + ')';
            break;
    }
    
    return inputText;
}

function calculateGradients(r, g, b){
    const brightness = calculateBrightness(r, g, b);
    const numShades = Math.round(brightness * 36);
    const numTints = Math.round(36 - brightness * 36);
    
    if((numShades + numTints) < 36){
        if(brightness < 0.5) numTints++;
        else numShades++;
    }

    return [numShades, numTints];
}

function calculateBrightness(r, g, b){
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/*Color Wheel math functions*/

function xyToPolar(x, y){
    let distance = Math.sqrt(x * x + y * y);
    let phi = Math.atan2(y, x);

    return{
        distance,
        phi
    }
}

function radToDeg(rad) {
    return ((rad + Math.PI) / (2 * Math.PI)) * 360;
}