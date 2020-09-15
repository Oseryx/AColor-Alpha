//Imports
const sortable = require('sortablejs');

//Get the first canvas which responsible for drawing the hue and saturation properties (It's the chromatic circle)
const colorWheel = document.getElementById('colorwheel');
const colorWheelCtx = colorWheel.getContext('2d');

//Get the second canvas which is responsible for drawing the volume property
const colorWheelVolume = document.getElementById('colorwheel-volume');
const colorWheelVolumeCtx = colorWheelVolume.getContext('2d');

//Get the third canvas which is responsible for drawing the pickers and handling them
const colorWheelPickers = document.getElementById('colorwheel-pickers');
const colorWheelPickersCtx = colorWheelPickers.getContext('2d');

//The radius of the colorwheel
const radius = colorWheel.width / 2;
//The number of pixels in each row which is the diameter => radius * 2
const rowLength = radius * 2;
//The pixel width in the data array of the generated image each pixels is 4 items of the array so to mive on the next pixel we move by 4 items
const pixelWidth = 4;

let volume = 100;
let targetPickerIndex = -1;
let isMovingPicker = false;

//Define the pickers
const pickers = [
    {
        //Set the x and y position of the picker
        pos: { x: 100, y: 100 },
        //Color object which contains the picked color info
        color: {
            //Set the rgb and hsv values of the picker
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 }
        }
    },
    {
        pos: { x: 150, y: 150 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 }
        }
    },
    {
        pos: { x: 200, y: 200 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 }
        }
    },
    {
        pos: { x: 200, y: 150 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 }
        }
    },
    {
        pos: { x: 150, y: 200 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 0 }
        }
    }
];

let pickersOrder = [4, 3, 0, 1, 2];
let currentFocusPicker = 0;

const pickerRadius = 15;

let analogusAngle = 30;
let analogusRotation = degToRad(-90);
let analogusLeaderOriginalDistance = 125;

/*
    How the color wheel will be done:

    The wheel gives color values in hsv format and it'll be automatically converted to hex, rgb, hsl and cmyk

    We'll use 3 canvases to avoid recalculating some parts of the wheel
    Canvases:
    1: It will represent the hue and the saturation, we calculate it once, at the start of the program
    2: It will be a circle that'll represent the volume of the wheel, each color of the palette can have it's own volume so the circle can be recalculted depending on the focus palette item
    3: It will be the canvas that is reponsible of drawing the pickers of the color wheel, it will calculated all of their positions based on the moved one and the color harmony's type used

    Color harmony types:
    - Analogus
    - Monochromatic
    - Triad
    - Complementary
    - Split Complementary
    - Double Split Complementary
    - Square
    - Compound
    - Shades
    - Custom

*/

drawWheel();
drawVolume(volume);
analogus(-1);
drawPickers();
setPaletteInputs();
setSliders();

new sortable(document.getElementById('current-palette'), {
    animation: 250
});

// document.getElementById('volume').addEventListener('input', () => {
//     volume = Number(document.getElementById('volume').value);
//     drawVolume(volume);
//     drawPickers();
// });

//The drawWheel function draws the chromatic circle in the first canvas, it's calculated only one time at the begining of the program
function drawWheel(){
    //We create the image that covers the full width and height of the canvas
    const wheel = colorWheelCtx.createImageData(colorWheel.width, colorWheel.height);
    //We get it's data
    const wheelData = wheel.data;

    for(let x = -radius; x < radius; x++){
        for(let y = -radius; y < radius; y++){
            //We get the distance between the given point and teh center with the rotation relative to the center
            const { distance, phi } = xyToPolar(x, y);
            
            //If the given point is out of the circle then skip to the next iteration
            //We add 1 to the radius so when rendering we'll have extra pixels that will be hidden by the border-radius of the canvas
            //So we see a nice curve instead of ugly pixels around the circle
            if(distance > radius + 1) continue;

            //Calculate the hue and the saturation, 
            //The hue is given by calculating the angle between the given point and the center if the circle
            const hue = Math.round(radToDeg(phi));
            //The saturation is calculated by dividing the distance by the radius if the circle
            const saturation = distance / radius;

            //Adjust the x and y position relative to the canvas
            const adjustX = x + radius;
            const adjustY = y + radius;

            //Calculate the index of the pixel which is calculated by using this formula: x + y * width and then multiply the result by 4
            //because the array is partitionned in 4 parts for each 4 values, value: 1 -> R | 2 -> G | 3 -> B | 4  -> A
            const index = (adjustX + adjustY * rowLength) * pixelWidth;
            
            //Convert the hsv value to rgb 
            const rgb = hsvToRgb(hue, saturation * 100, 100);

            //Set the rgb values (the fourth value is the alpha value we set it to it's maximum -> 255)
            wheelData[index] = rgb[0];
            wheelData[index + 1] = rgb[1];
            wheelData[index + 2] = rgb[2];
            wheelData[index + 3] = 255;
        }
    }
    //Draw the wheel
    colorWheelCtx.putImageData(wheel, 0, 0);
}

//The drawVolume function draws a black rectangle that cover all the canvas but we add an alpha value to it, which is by default 0
//so with this little trick we'll the same result if we add a volume value to the chromatic circle 
//and using these simple lines of code we avoid recalculating the chromatic circle and a lot of maths stuff that makes the program slower
function drawVolume(volume){
    //When the volume is to 100 that mean that we have no effect to apply so to get the alpha we get the difference between 100 and the volume
    //Then we divide by 100
    volume = (100 - volume) / 100;
    //We clear the canvas every time when the function is called
    colorWheelVolumeCtx.clearRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
    //We set the style to black and set the volume parameter for the alpha
    colorWheelVolumeCtx.fillStyle = 'rgba(0, 0, 0, ' + volume + ')';
    //We draw the rect
    colorWheelVolumeCtx.fillRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
}

function drawPickers() {
    //We clear the rect every time we call the function
    colorWheelPickersCtx.clearRect(0, 0, colorWheelPickers.width, colorWheelPickers.height);
    //We loop through each picker
    for(let i = 0; i < pickers.length; i++){
        //We target the picker
        const picker = pickers[i];
        //If the volume is too low that mean we're in dark colors so we set the picker to white color otherwise we set a black color for the picker
        colorWheelPickersCtx.strokeStyle = (volume < 40) ? '#fff' : '#000';
        //We begin the path
        colorWheelPickersCtx.beginPath();
        //We draw the picker which is a circle
        colorWheelPickersCtx.arc(picker.pos.x, picker.pos.y, pickerRadius, 0, 2 * Math.PI);
        //We enable the stroke so we can see it
        colorWheelPickersCtx.stroke();

        picker.color = getColor(picker.pos.x, picker.pos.y);
        colorWheelPickersCtx.fillStyle = ('rgb(' + picker.color.rgb.r + ',' + picker.color.rgb.g + ',' + picker.color.rgb.b + ')');
        colorWheelPickersCtx.fill();
    }
    setPalette();
    setSliders();
}

function getColor(x, y){
    x -= radius;
    y -= radius;

    //We reproduce the same steps ad the drawWheel function but we won't use it to define the hsv, we'll get the hue and the saturation
    const { distance, phi } = xyToPolar(x, y);
    const hue = Math.round(radToDeg(phi));
    const saturation = distance / radius * 100;

    //We get the volume value using the volume slide
    //const volume = Number(document.getElementById('volume').value);
    const volume = 100;

    //We convert from hsv to rgb
    const rgb = hsvToRgb(hue, saturation, volume, 1);

    return {
        rgb: {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        },
        hsv: {
            h: hue,
            s: saturation,
            v: volume
        }
    }
}

//Harmonies functions
//Analogus harmony
function analogus(movedPickerIndex){
    //Check if the index is the leader picker

    //if true 
    //      |-> We calculate  the distance to shrink if the leader picker shrink it's distance to the center and we shrink all of the picker
    //      |-> We calculate the new rotation, if the leader picker rotation changes we rotate all of the other pickers
    //else 
    //      |-> We calculate the angle relative to the leader picker and we move all pickers by the new angle except the leader picker
    
    //We get the leader picker
    const leaderPicker = pickers[0];
    //We define the rad that'll be used for pickers calculations
    let rad = analogusRotation;
    //We set the analogus distance factor
    let analogusDistanceFactor = 1;

    //This condition applies if we're moving the leader picker
    if(movedPickerIndex === 0){
        //We calculate the distance between the leader picker and the center
        const analogusNewDistance = calculateDistance(leaderPicker.pos.x - radius, 0, leaderPicker.pos.y - radius, 0);
        //If the calculated distance is different from the previous distance that implies that the distance changed
        if(analogusNewDistance !== analogusLeaderOriginalDistance){
            //We calculate the factor between the new distance and the old one
            analogusDistanceFactor = analogusNewDistance / analogusLeaderOriginalDistance;
            //We set the oldDistance equal to the calculated one
            analogusLeaderOriginalDistance = analogusNewDistance;
        }

        //We calculate the analogusRotationof the analogus harmony
        analogusRotation = Math.atan2(leaderPicker.pos.y - radius, leaderPicker.pos.x - radius);
    }
    //This condtion applies of we're moving a non leader picker and we're not in the case of generation
    else if(movedPickerIndex !== -1) {
        //We calculate the leader picker rotation
        const leaderRotation = Math.atan2(leaderPicker.pos.y - radius, leaderPicker.pos.x - radius);
        //We calculate the picker rotation
        const pickerRotation = Math.atan2(pickers[movedPickerIndex].pos.y - radius, pickers[movedPickerIndex].pos.x - radius);

        //We calculate the analogus angle by substracting the leader rotation from the picker rotation 
        analogusAngle = Math.abs(radToDeg(leaderRotation) - radToDeg(pickerRotation));
        //If the angle is greater then 180 we set the angle by the susbstraction of 360 minus the calculated angle
        if(analogusAngle > 180) analogusAngle = 360 - analogusAngle;
        //If the picker index is odd that means we're moving a picker that is two times far away from the leader picker so we divide by 2 if it's the case
        analogusAngle = (movedPickerIndex % 2 === 1) ? analogusAngle : analogusAngle / 2;
    }

    //We loop through each picker after set all needed variables
    for(let i = 0; i < 5; i++){
        //We target the picker
        const picker = pickers[i];
        //We calculate the distance between the picker and the center of the chromatic circle
        const distance = (movedPickerIndex !== -1) ? 
                //If it's not the case if generating a analogus harmony we calculate the distance between the picker and the center if the chromatic circle
                //Then we multiply it by the analogusDistanceFactor, if we are moving a non leader picker the default value is one 
                //Otherwise it's a another value that is calculated in the condition above
                calculateDistance(picker.pos.x - radius, 0, picker.pos.y - radius, 0) * analogusDistanceFactor
                //If we are in the case if a generation we set the distance to 125 (This part'll be changed)
                : 125;

        //We calculate the x position, by using the cosine * distance (if the distance is greater than the radius 
        //so the distance'll be equal to the radius and with we'll have a collision system)
        //Then we add the the radius of the chromatic circle so we adjust the x position
        const x = Math.cos(rad) * ((distance <= radius) ? distance : radius) + radius;
        //Same thing as the x position calculation but we use sine for the y position
        const y = Math.sin(rad) * ((distance <= radius) ? distance : radius) + radius;
        
        //If we are in the 3rd picker that mean we should come back to the leader picker and move back by the oposite of the analogusAngle
        if(i === 2) rad = analogusRotation - degToRad(analogusAngle);
        //If we're after the 3rd picker we move bac the angle instead of moving forwards
        else if(i >= 3) rad -= degToRad(analogusAngle);
        //If all these condition are not applied then we still in the 3 first pickers so we move the angle forwards
        else rad += degToRad(analogusAngle);

        //We set the picker x and y positions
        pickers[i].pos = { x: x, y: y };
    }
}

//DOM Events
colorWheelPickers.addEventListener('mousedown', (event) => {
    const bounds = colorWheelPickers.getBoundingClientRect();
    const x = event.clientX - bounds.left - radius;
    const y = event.clientY - bounds.top - radius;
    let maxDistance = pickerRadius;

    for(let i = 0; i < pickers.length; i++){
        const picker = pickers[i];
        const distance = calculateDistance(x, picker.pos.x - radius, y, picker.pos.y - radius);
        
        if(distance < maxDistance){
            maxDistance = distance;
            targetPickerIndex = i;
        }
    }
    
    maxDistance = 10;

    if(targetPickerIndex !== -1){
        isMovingPicker = true;
        //console.log(targetPickerIndex);
    }
});

document.addEventListener('mouseup', () => {
    isMovingPicker = false;
    targetPickerIndex = -1;
});

document.addEventListener('mousemove', (event) => {
    if(isMovingPicker){
        const bounds = colorWheelPickers.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;

        const radian = Math.atan2(y - radius, x - radius);
        const distance = calculateDistance(x - radius, 0, y - radius, 0);

        pickers[targetPickerIndex].pos = {
            x: (distance <= radius) ? x : Math.cos(radian) * radius + radius,
            y: (distance <= radius) ? y : Math.sin(radian) * radius + radius
        };

        analogus(targetPickerIndex, distance);
        drawPickers();
    }
});

//Temporary functions
function getRgb(index){
    const picker = pickers[index].color.rgb;
    return 'rgb(' + picker.r + ',' + picker.g + ',' + picker.b + ')';
}

function setPalette(){
    for(let i = 0; i < pickers.length; i++){
        document.getElementsByClassName('current-palette-item')[i].style.setProperty('background-color', getRgb(pickersOrder[i]));
    }
    // document.getElementsByClassName('current-palette-item')[0].style.setProperty('background-color', getRgb(4));
    // document.getElementsByClassName('current-palette-item')[1].style.setProperty('background-color', getRgb(3));
    // document.getElementsByClassName('current-palette-item')[2].style.setProperty('background-color', getRgb(0));
    // document.getElementsByClassName('current-palette-item')[3].style.setProperty('background-color', getRgb(1));
    // document.getElementsByClassName('current-palette-item')[4].style.setProperty('background-color', getRgb(2));
    // for(let i = 0; i < pickers.length; i++){
    //     document.getElementById(i).style.setProperty('background-color', getRgb(i));
    // }
}

function setPaletteInputs(){
    for(let i = 0; i < pickers.length; i++) setPaletteItemInput(i);
}

function setPaletteItemInput(index){
    const paletteItem = document.getElementsByClassName('current-palette-item')[index];
    paletteItem.addEventListener('click', () => {
        currentFocusPicker = pickersOrder[index];
        setSliders()
    });
}

function setSliders(){
    document.getElementById('hue').value = pickers[currentFocusPicker].color.hsv.h;
    document.getElementById('saturation').value = pickers[currentFocusPicker].color.hsv.s;
    document.getElementById('volume').value = pickers[currentFocusPicker].color.hsv.v;
}