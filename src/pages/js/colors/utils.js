const { property } = require("lodash");

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

function hsvToRgb(h, s, v, alpha) {
    let r, g, b;
    let i;
    let f, p, q, t;
     
    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));
     
    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;
     
    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [
            Math.round(r * 255), 
            Math.round(g * 255), 
            Math.round(b * 255)
        ];
    }
     
    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));
     
    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
     
        case 1:
            r = q;
            g = v;
            b = p;
            break;
     
        case 2:
            r = p;
            g = v;
            b = t;
            break;
     
        case 3:
            r = p;
            g = q;
            b = v;
            break;
     
        case 4:
            r = t;
            g = p;
            b = v;
            break;
     
        default: // case 5:
            r = v;
            g = p;
            b = q;
    }
     
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

    numbers = checkNumbers(numbers.slice(0, 4));
    numbers = validateInputs(numbers, type);
    
    return numbers;
}

function checkNumbers(properties){
    for(let i = 0; i < 3; i++){
        if(!properties[i]) properties.push(255);
        else properties[i] = Number(properties[i].toFixed(0));
    }

    if(!properties[3] && properties[3] !== 0) properties.push(1);
    else if (properties[3] > 1 || properties[3] < 0) properties[3] = 1;
    else properties[3] = Number(properties[3].toFixed(2));    

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