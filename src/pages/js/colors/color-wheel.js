const colorWheel = document.getElementById('colorwheel');
const colorWheelCtx = colorWheel.getContext('2d');

const colorWheelVolume = document.getElementById('colorwheel-volume');
const colorWheelVolumeCtx = colorWheelVolume.getContext('2d');

const radius = colorWheel.width / 2;
const rowLength = radius * 2;
const pixelWidth = 4;

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
drawVolume(0);

document.getElementById('volume').addEventListener('input', () => {
    drawVolume(Number(document.getElementById('volume').value) / 100);
});

function drawWheel(){
    const wheel = colorWheelCtx.createImageData(colorWheel.width, colorWheel.height);
    let wheelData = wheel.data;

    for(let x = -radius; x < radius; x++){
        for(let y = -radius; y < radius; y++){
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

function drawVolume(volume){
    //We clear the canvas every time when the function is called
    colorWheelVolumeCtx.clearRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
    //We set the style to black and set the volume parameter for the alpha
    colorWheelVolumeCtx.fillStyle = 'rgba(0, 0, 0, ' + volume + ')';
    //We draw the rect
    colorWheelVolumeCtx.fillRect(0, 0, colorWheelVolume.width, colorWheelVolume.height);
}

function drawPickers(harmonyType) {
    if(harmonyType === 'custom') customHarmony();
}

function customHarmony(){

}