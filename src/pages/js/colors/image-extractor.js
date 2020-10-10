const palette = require('image-palette');
const pixels = require('image-pixels');
const sortable = require('sortablejs');

const dropbox = document.getElementById('dropbox');
const mainBox = document.getElementById('mainBox');

document.addEventListener('dragover', (event) => {
    event.preventDefault();
});

document.addEventListener('dragenter', (event) => {
    if(event.target.classList.contains('drag-drop-image') || event.target.classList.contains('drag-drop-text')){
        if(!dropbox.classList.contains('drop-hover')) dropbox.classList.toggle('drop-hover');
    }
});

document.addEventListener('dragleave', (event) => {
    if(event.target.classList.contains('drag-drop-image')){
        dropbox.classList.toggle('drop-hover');
    }
});

document.addEventListener('drop', (event) => {
    if(!(event.target.id === 'dropbox' || event.target.id === 'chosen-image' || dropbox.contains(event.target))) return;
    const file = event.dataTransfer.files[0];
    const fileType = file.type;
    if(fileType.split('/')[0] === 'image' && fileType.split('/')[1] !== 'gif'){
        getPalette(file.path, 10).then(({colors, amount, width, height}) => {
            console.log(width, height);
            setImage(file.path, colors.length);
            setPalette(colors, amount);

            new sortable(document.getElementById('palette-items'), {
                animation: 150,
                onEnd: () => {
                    for(let i = 0; i < document.getElementById('palette-items').childElementCount; i++){
                        console.log(document.getElementById('palette-items').childNodes[i]);
                    }
                }
            });
        });
    }
    dropbox.classList.toggle('drop-hover');
});

function setImage(src, number){
    const imageBox = document.getElementById('image-box');
    const width = number * 35 + number * 4;
    imageBox.innerHTML = `
        <div class="chosen-image-box">
            <img src="` + src + `" class="chosen-image" id="chosen-image">
        </div>`;
    imageBox.innerHTML += `
    <div class="palette-box">
        <div class="image-palette" style="width: ` + width + `px;" id="palette-items"></div>
        <div class="image-palette-amount" style="width: ` + width + `px;" id="palette-amount"></div>
    </div>`;
}

function setPalette(colors, amount){
    //console.log(colors);
    let colorsContent = ``;
    let amountContent = ``;
    for(let i = 0; i < colors.length; i++){
        const color = colors[i];
        colorsContent += `<div class="image-palette-item" style="background-color: rgba(` + color[0] + `,` + color[1] + `,` + color[2] + `,` + (color[3] / 255) + `);"></div>`;
        amountContent += `<div class="image-palette-amount-item" style="background-color: rgba(` + color[0] + `,` + color[1] + `,` + color[2] + `,` + (color[3] / 255) + `); width: ` + amount[i] * 100 + `%;"></div>`;
    }
    //console.log(colorsContent, amountContent);
    document.getElementById('palette-items').innerHTML = colorsContent;
    document.getElementById('palette-amount').innerHTML = amountContent;
}

async function getPalette(src, colorNumber){
    const { width, height } = await pixels(src).then(data => {
        //console.log(data);
        return {
            width: data.width,
            height: data.height
        }
    })
    const {colors, amount} = palette(await pixels(src), colorNumber);
    return {
        colors,
        amount,
        width, 
        height
    }
}