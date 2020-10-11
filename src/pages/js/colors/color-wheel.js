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

let targetPickerIndex = 0;
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
            hsv: { h: 0, s: 0, v: 100 }
        }
    },
    {
        pos: { x: 150, y: 150 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 100 }
        }
    },
    {
        pos: { x: 200, y: 200 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 100 }
        }
    },
    {
        pos: { x: 200, y: 150 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 100 }
        }
    },
    {
        pos: { x: 150, y: 200 },
        color: {
            rgb: { r: 0, g: 0, b: 0 },
            hsv: { h: 0, s: 0, v: 100 }
        }
    }
];

let pickersOrder = [4, 3, 0, 1, 2];
//let targetPickerIndex = 0;

let harmonyMode = 'analogus';

const RH = document.getElementById('RH');
const GS = document.getElementById('GS');
const BV = document.getElementById('BV');

const pickerRadius = 15;

//Analogus variables

let analogusAngle = 30;
let analogusRotation = degToRad(-90);
let analogusLeaderOriginalDistance = 125;
let inverseAnalogusPickers = false;

//Monochromatic variables
let monochromaticRotation = degToRad(-90);
let monochromaticDistances = [70, 70];

//Triad variables
const triadAngle = 120;
let triadRotation = degToRad(-90);
let triadDistances =  [0, 0, 0, 0];

//Complementary variables
let complementaryRotation = degToRad(-90);
let complementaryDistances = [0, 0, 0, 0];
/*
    How the color wheel will be done:

    The wheel gives color values in hsv format and it'll be automatically converted to hex, rgb, hsl and cmyk

    We'll use 3 canvases to avoid recalculating some parts of the wheel
    Canvases:
    1: It will represent the hue and the saturation, we calculate it once, at the start of the program
    2: It will be a circle that'll represent the volume of the wheel, each color of the palette can have it's own volume so the circle can be recalculted depending on the focus palette item
    3: It will be the canvas that is reponsible of drawing the pickers of the color wheel, it will calculated all of their positions based on the moved one and the color harmony's type used

    Color harmony types:
    - Analogus [Done]
    - Monochromatic [Done]
    - Triad [Done]
    - Complementary [Working on it]
    - Split Complementary
    - Double Split Complementary
    - Square
    - Compound
    - Shades
    - Custom

*/

drawWheel();
drawVolume(0);
harmony(-1);
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
            const oldHue = Math.round(radToDeg(phi));
            const hue = (oldHue > 180) ? oldHue - 180 : oldHue + 180;
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
function drawVolume(index){
    //When the volume is to 100 that mean that we have no effect to apply so to get the alpha we get the difference between 100 and the volume
    //Then we divide by 100
    const volume = (100 - pickers[index].color.hsv.v) / 100;
    //We clear the canvas every time when the function is called
    colorWheelVolumeCtx.clearRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
    //We set the style to black and set the volume parameter for the alpha
    colorWheelVolumeCtx.fillStyle = 'rgba(0, 0, 0, ' + volume + ')';
    //We draw the rect
    colorWheelVolumeCtx.fillRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
}

//The drawPickers function is responsible for rendering the pickers (not calculating their positions)
//It defines the palette and the sliders also
function drawPickers() {
    //We clear the rect every time we call the function
    colorWheelPickersCtx.clearRect(0, 0, colorWheelPickers.width, colorWheelPickers.height);
    //We loop through each picker
    for(let i = 0; i < pickers.length; i++){
        //We target the picker
        const picker = pickers[i];

        //We draw a line to the picker
        colorWheelPickersCtx.beginPath();
        //Se set the stroke style to white
        colorWheelPickersCtx.strokeStyle = '#fff';
        //We move to the center of the chromatic circle
        colorWheelPickersCtx.moveTo(radius, radius);
        //We set the line to the center of the picker (the overflow we'll be hidden by the drawing of the circles so we'll have no weird extra line)
        colorWheelPickersCtx.lineTo(picker.pos.x, picker.pos.y);
        //We enable the stroke to see the draw line
        colorWheelPickersCtx.stroke();

        //Now we'll draw the pickers
        //If the volume is too low that mean we're in dark colors so we set the picker to white color otherwise we set a black color for the picker
        colorWheelPickersCtx.strokeStyle = (pickers[i].color.hsv.v < 40) ? '#fff' : '#000';
        //We begin the path
        colorWheelPickersCtx.beginPath();
        //We draw the picker which is a circle
        colorWheelPickersCtx.arc(picker.pos.x, picker.pos.y, pickerRadius, 0, 2 * Math.PI);
        //We enable the stroke so we can see it
        colorWheelPickersCtx.stroke();

        picker.color = getColor(picker.pos.x, picker.pos.y, i);
        colorWheelPickersCtx.fillStyle = ('rgb(' + picker.color.rgb.r + ',' + picker.color.rgb.g + ',' + picker.color.rgb.b + ')');
        colorWheelPickersCtx.fill();
    }
    drawPickerOntop();
    //We set the palette
    setPalette();
    //We set the sliders
    setSliders();
}

function drawPickerOntop(){
    const picker = pickers[targetPickerIndex];
    colorWheelPickersCtx.strokeStyle = (picker.color.hsv.v < 40) ? '#fff' : '#000';
    colorWheelPickersCtx.beginPath();
    colorWheelPickersCtx.arc(picker.pos.x, picker.pos.y, pickerRadius, 0, 2 * Math.PI);
    colorWheelPickersCtx.stroke();

    picker.color = getColor(picker.pos.x, picker.pos.y, targetPickerIndex);
    colorWheelPickersCtx.fillStyle = ('rgb(' + picker.color.rgb.r + ',' + picker.color.rgb.g + ',' + picker.color.rgb.b + ')');
    colorWheelPickersCtx.fill();
}

function getColor(x, y, index){
    x -= radius;
    y -= radius;

    //We reproduce the same steps ad the drawWheel function but we won't use it to define the hsv, we'll get the hue and the saturation
    const { distance, phi } = xyToPolar(x, y);
    const oldHue = Math.round(radToDeg(phi));

    const hue = (oldHue >= 180) ? oldHue - 180 : oldHue + 180;
    const saturation = distance / radius * 100;

    //We get the volume value using the volume slide
    //const volume = Number(document.getElementById('volume').value);
    const volume = pickers[index].color.hsv.v;

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
function harmony(movedPickerIndex){
    if(harmonyMode === 'analogus'){
        analogus(movedPickerIndex);
    }
    else if(harmonyMode === 'monochromatic'){
        monochromatic(movedPickerIndex);
    }
    else if(harmonyMode === 'triad'){
        triad(movedPickerIndex);
    }
    else if(harmonyMode === 'complementary'){
        complementary(movedPickerIndex);
    }
    drawPickers();
}

//Analogus harmony
function analogus(movedPickerIndex){
    //Check if the index is the leader picker

    /*
      if true 
            |-> We calculate  the distance to shrink if the leader picker shrink it's distance to the center and we shrink all of the picker
            |-> We calculate the new rotation, if the leader picker rotation changes we rotate all of the other pickers
      else 
            |-> We calculate the angle relative to the leader picker and we move all pickers by the new angle except the leader picker
    */

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

        //We calculate in which direction is the rotation if it's the right pickers so it's 1 if not it's -1
        const rotationDirection = (movedPickerIndex < 3) ? 1 : -1;
        //We calculate the angle between the picker and the leader picker, if we are on the top of the circle we calculate the difference between 360 and the calculated angle
        //If we not calculate the angle normaly
        const angle = (radToDeg(leaderRotation) < 180) ? (360 - radToDeg(leaderRotation)) - (360  - radToDeg(pickerRotation)) : radToDeg(leaderRotation) - radToDeg(pickerRotation);
        
        //If we are moving the right pickers
        if(rotationDirection === 1){
            //If the leader is in the top of the circle
            if(radToDeg(leaderRotation) < 180){
                //If x ∈ ] - ∞; 0 [ ∪ ] 180; + ∞ [ that means we've passed the leader rotation by 180⁰ so we inverse the pickers
                if(angle > 180 || angle < 0) inverseAnalogusPickers = true;
                //If not we don't inverse
                else inverseAnalogusPickers = false;
            }
            //If not
            else {
                //If x ∈ ] 0; 180 [ that means we've passed the leader rotation by 180⁰ so we inverse the pickers
                if(angle < 180 && angle > 0) inverseAnalogusPickers = true;
                else inverseAnalogusPickers = false;
            }
        }
        //If we are moving the left pickers
        else{
            //Same thing as right pickers but we inverse conditions after checking in which part of the circle(top or bottom) we're
            if(radToDeg(leaderRotation) < 180){
                if(angle < 180 && angle > 0) inverseAnalogusPickers = true;
                else inverseAnalogusPickers = false;
            }
            else {
                if(angle > 180 || angle < 0) inverseAnalogusPickers = true;
                else inverseAnalogusPickers = false;
            }
        }

        //We calculate the analogus angle by substracting the leader rotation from the picker rotation
        analogusAngle = Math.abs(radToDeg(leaderRotation) - radToDeg(pickerRotation));
        //If the angle is greater then 180 we set the angle by the susbstraction of 360 minus the calculated angle
        if(analogusAngle > 180) analogusAngle = (360 - analogusAngle);
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
        
        if(inverseAnalogusPickers == false){
            //If we are in the 3rd picker that mean we should come back to the leader picker and move back by the oposite of the analogusAngle
            if(i === 2) rad = analogusRotation - degToRad(analogusAngle);
            //If we're after the 3rd picker we move bac the angle instead of moving forwards
            else if(i >= 3) rad -= degToRad(analogusAngle);
            //If all these condition are not applied then we still in the 3 first pickers so we move the angle forwards
            else rad += degToRad(analogusAngle);
        }
        else{
            if(i === 2) rad = analogusRotation + degToRad(analogusAngle);
            else if(i >= 3) rad += degToRad(analogusAngle);
            else rad -= degToRad(analogusAngle);
        }

        //We set the picker x and y positions
        picker.pos = { x: x, y: y };
    }
}

//Monochrmoatic harmony
function monochromatic(movedPickerIndex){
    /*
    The monochromatic harmony is very simple they are 3 rules to apply (the monochromatic harmony is very special also we have 3 leader pickers and 2 non leader
    the 3 leader pickers are in the same position picking the same color but they have different volumes so different shades):
    - They all have the same rotation (monochromatic harmony use only one hue comparing to other harmonies like triad analogus and so on)
    - There is no distance factor but distance difference, the distance between teh non leader picker and the center is calculated 
        by substracting the leader picker distance by the distance between the leader picker and the non leadre picker
    - If the non leader picker has a distance less then 0 we calculate it's distance using the same formula but we'll sum them instead of substracting them
    */

    //We calculate the distance between the leader picker and the center of the chromatic circle
    //If we're moving a non leader picker we set the leader distance to the distance between the center and the picker with index 0
    const leaderDistance = (movedPickerIndex > 2 || movedPickerIndex === -1) ? calculateDistance(pickers[0].pos.x - radius, 0, pickers[0].pos.y - radius, 0) 
    //Otherwise we're moving a leader picker so we calculate the distance normaly, so when we're moving the 2 others leader keys they won't be blocked by the leader picker 0
    : calculateDistance(pickers[movedPickerIndex].pos.x - radius, 0, pickers[movedPickerIndex].pos.y - radius, 0);

    //If we're generating a monochromatic harmony we set some default volume values
    if(movedPickerIndex === -1){
        pickers[4].color.hsv.v = 90;
        pickers[3].color.hsv.v = 70;
        pickers[0].color.hsv.v = 90;
        pickers[1].color.hsv.v = 75;
        pickers[2].color.hsv.v = 60;
    }
    //If we're moving a non leader picker we calculate the distance between the moved picker and the leader picker
    else if(movedPickerIndex > 2){
        monochromaticDistances[movedPickerIndex - 3] = calculateDistance(pickers[0].pos.x - radius, pickers[movedPickerIndex].pos.x - radius, pickers[0].pos.y - radius, pickers[movedPickerIndex].pos.y - radius);
        monochromaticDistances[movedPickerIndex - 3] *= (calculateDistance(pickers[movedPickerIndex].pos.x - radius, 0, pickers[movedPickerIndex].pos.y - radius, 0) <= leaderDistance) ? 1 : -1;
    }
    //If we're not generating a monochromatic hramoy, we calculate the rotation of the monochromatic harmoy
    if(movedPickerIndex !== -1) monochromaticRotation = Math.atan2(pickers[movedPickerIndex].pos.y - radius, pickers[movedPickerIndex].pos.x - radius);

    //We loop trough each picker
    for(let i = 0; i < pickers.length; i++){
        const picker = pickers[i];
        //We define the default distance
        let distance = 0;

        //If we're generating a monochromatic harmony we set the distance to 125 for leader pickers and 55 for non leader pickers
        if(movedPickerIndex === -1){
            distance = (i < 3) ? 125 : 55;
        }
        //If the target picker is a non leader picker and we're not moving a non leader pickers (Cause if it's the case we won't be able to move the non leader picker)
        else if(i > 2 && movedPickerIndex < 3){
            //We set the distance to the difference between the leader distance and the monochromatic distance that we calculated earlier
            //If the result is less then 0 so we set the distance to the sum between the leader distance and the monochromatic distance
            distance = (leaderDistance - monochromaticDistances[i - 3] >= 0 && leaderDistance - monochromaticDistances[i - 3] <= radius) ? leaderDistance - monochromaticDistances[i - 3] : leaderDistance + monochromaticDistances[i - 3];
        }
        //Otherwise
        else{
            //If we're targeting a leader picker we set it's distance to the leader distance (cause we've calculated in the beginning of the function)
            //Otherwise we calculate it normaly
            distance = (i < 3) ? leaderDistance : calculateDistance(picker.pos.x - radius, 0, picker.pos.y - radius, 0);
        }

        //We calculate the x and y position using the same formula in the analogus harmnoy (and it'll be used in all harmonies)
        const x = Math.cos(monochromaticRotation) * ((distance <= radius) ? distance : radius) + radius;
        const y = Math.sin(monochromaticRotation) * ((distance <= radius) ? distance : radius) + radius;

        //We set the position
        picker.pos = { x: x, y: y };
    }
}

function triad(movedPickerIndex){
    const leaderDistance = (movedPickerIndex > -1) ? calculateDistance(pickers[0].pos.x - radius, 0, pickers[0].pos.y - radius, 0) : 125;

    if(movedPickerIndex !== -1){
        triadRotation = Math.atan2(pickers[movedPickerIndex].pos.y - radius, pickers[movedPickerIndex].pos.x - radius);
        if(movedPickerIndex > 0) triadRotation -= degToRad(triadAngle)
        if(movedPickerIndex > 2) triadRotation -= degToRad(triadAngle)
    }
    if(movedPickerIndex > 0) {
        triadDistances[movedPickerIndex - 1] = leaderDistance - calculateDistance(pickers[movedPickerIndex].pos.x - radius, 0, pickers[movedPickerIndex].pos.y - radius, 0);
        //console.log(triadDistances[movedPickerIndex - 1])
    }

    //Create a copy of the triad rotation to keep the original rotation
    let renderingTriadRotation = triadRotation;

    for(let i = 0; i < pickers.length; i++){
        //console.log(triadDistances);
        const picker = pickers[i];

        let distance = 0;

        if(i > 0 && movedPickerIndex === 0){
            distance = (leaderDistance - triadDistances[i - 1] > pickerRadius) ? leaderDistance - triadDistances[i - 1] : leaderDistance + triadDistances[i - 1];
        }
        else if(i === 0){
            distance = leaderDistance;
        }
        else if(i !== -1){
            distance = calculateDistance(picker.pos.x - radius, 0, picker.pos.y - radius, 0);
        }
        
        //const pickerDistance = calculateDistance(picker.pos.x - radius, 0, picker.pos.y - radius, 0);
        distance = (movedPickerIndex === -1) ? ((i % 2 === 0) ? 125 : 90) : distance;
        distance = (distance <= radius) ? distance : radius;
        
        const x = Math.cos(renderingTriadRotation) * distance + radius;
        const y = Math.sin(renderingTriadRotation) * distance + radius;
        
        if(i === 0 || i === 2) renderingTriadRotation += degToRad(triadAngle);

        picker.pos = { x: x, y: y };
    }

    //We set all the triad distances after generating the triad harmony
    if(movedPickerIndex === -1){
        for(let i = 1; i < 5; i++){
            triadDistances[i - 1] = leaderDistance - calculateDistance(pickers[i].pos.x - radius, 0, pickers[i].pos.y - radius, 0);
        }
    }
}

function complementary(movedPickerIndex){
    const leaderDistance = (movedPickerIndex > -1) ? calculateDistance(pickers[0].pos.x - radius, 0, pickers[0].pos.y - radius, 0) : 125;

    if(movedPickerIndex !== -1){
        complementaryRotation = Math.atan2(pickers[movedPickerIndex].pos.y - radius, pickers[movedPickerIndex].pos.x - radius);
        if(movedPickerIndex > 2) complementaryRotation -= degToRad(180);
    }
    if(movedPickerIndex > 0){
        complementaryDistances[movedPickerIndex - 1] = leaderDistance - calculateDistance(pickers[movedPickerIndex].pos.x - radius, 0, pickers[movedPickerIndex].pos.y - radius, 0);
    }

    let renderingComplementaryRotation = complementaryRotation;
    for(let i = 0; i < pickers.length; i++){
        const picker = pickers[i];

        let distance = 0;

        if(movedPickerIndex === -1){
            if(i === 0) distance = 115;
            else distance = (i % 2 === 0) ? 125 : 100;
        }
        else if(i > 0 && movedPickerIndex === 0){
            distance = (leaderDistance - complementaryDistances[i - 1] > 0) ? leaderDistance - complementaryDistances[i - 1] : 0;
        }
        else if(i === 0){
            distance = leaderDistance;
        }
        else{
            distance = calculateDistance(picker.pos.x - radius, 0, picker.pos.y - radius, 0);
        }

        distance = (distance <= radius) ? distance : radius;

        const x = Math.cos(renderingComplementaryRotation) * distance + radius;
        const y = Math.sin(renderingComplementaryRotation) * distance + radius;

        if(i === 2) renderingComplementaryRotation += degToRad(180);

        picker.pos = { x: x, y: y }
    }

    if(movedPickerIndex === -1){
        for(let i = 1; i < 5; i++){
            complementaryDistances[i - 1] = leaderDistance - calculateDistance(pickers[i].pos.x - radius, 0, pickers[i].pos.y - radius, 0);
        }
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

    if(maxDistance === pickerRadius) return;

    maxDistance = pickerRadius;
    isMovingPicker = true;

    document.getElementsByClassName('selected-item')[0].classList.toggle('selected-item');
    document.getElementById(targetPickerIndex).classList.toggle('selected-item');
    setSliders();

    colorWheelPickers.style.setProperty('cursor', 'crosshair');
});

document.addEventListener('mouseup', () => {
    isMovingPicker = false;
    colorWheelPickers.style.setProperty('cursor', 'default');
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

        drawVolume(targetPickerIndex);
        harmony(targetPickerIndex);
    }
    else{
        const bounds = colorWheelPickers.getBoundingClientRect();
        const x = event.clientX - bounds.left - radius;
        const y = event.clientY - bounds.top - radius;
        let maxDistance = pickerRadius;
    
        for(let i = 0; i < pickers.length; i++){
            const picker = pickers[i];
            const distance = calculateDistance(x, picker.pos.x - radius, y, picker.pos.y - radius);
            
            if(distance < maxDistance){
                maxDistance = distance;
            }
        }
        if(maxDistance < pickerRadius) colorWheelPickers.style.setProperty('cursor', 'crosshair');
        else colorWheelPickers.style.setProperty('cursor', 'default');
    }

});

//Sliders inputs
RH.addEventListener('input', () => {
    const value = RH.value;
    const hue = value;
    const saturation = pickers[targetPickerIndex].color.hsv.s / 100;

    const radian = degToRad(hue);
    const distance = radius * saturation;

    const x = Math.cos(radian) * distance + radius;
    const y = Math.sin(radian) * distance + radius;

    pickers[targetPickerIndex].pos = {
        x: x,
        y: y
    }

    harmony(targetPickerIndex);
});

GS.addEventListener('input', () => {
    const value = GS.value;

    const hue = pickers[targetPickerIndex].color.hsv.h;
    const saturation = value / 100;

    const radian = degToRad(hue);
    const distance = radius * saturation;

    const x = Math.cos(radian) * distance + radius;
    const y = Math.sin(radian) * distance + radius;

    pickers[targetPickerIndex].pos = {
        x: x,
        y: y
    }

    harmony(targetPickerIndex);
});

BV.addEventListener('input', () => {
    const value = BV.value;
    pickers[targetPickerIndex].color.hsv.v = value;
    drawVolume(targetPickerIndex);
    drawPickers();
});

document.getElementById('harmony-mode').addEventListener('change', () => {
    harmonyMode = document.getElementById('harmony-mode').value;
    harmony(-1);
});

//THis function return an rgb string of the given picker index
function getRgb(index){
    const picker = pickers[index].color.rgb;
    return 'rgb(' + picker.r + ',' + picker.g + ',' + picker.b + ')';
}

//This function set the palette of the picked colors from Color Harmony
function setPalette(){
    //We loop througth each picker
    for(let i = 0; i < pickers.length; i++){
        //We set an id to each item cause the palette item are sortable so using id conserve the order the user gave them
        document.getElementById(i).style.setProperty('background-color', getRgb(i));
    }
}

//We set the palette inputs
function setPaletteInputs(){
    for(let i = 0; i < pickers.length; i++) {
        const paletteItem = document.getElementsByClassName('current-palette-item')[i];
        paletteItem.addEventListener('click', () => {
            targetPickerIndex = pickersOrder[i];
            document.getElementsByClassName('selected-item')[0].classList.toggle('selected-item');
            paletteItem.classList.toggle('selected-item');
            if(Number(paletteItem.id) === targetPickerIndex) drawVolume(targetPickerIndex);
            setSliders();
            drawPickerOntop();
        });
    }
}

function setSliders(){
    let rh = 0;
    let gs = 0;
    let bv = 0;

    rh = pickers[targetPickerIndex].color.hsv.h;
    gs = pickers[targetPickerIndex].color.hsv.s;
    bv = pickers[targetPickerIndex].color.hsv.v;

    RH.value = rh;
    GS.value = gs
    BV.value = bv;
}
