const palette = require('image-palette');
const pixels = require('image-pixels');

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
    const file = event.dataTransfer.files[0];
    const fileType = file.type;
    if(fileType.split('/')[0] === 'image' && fileType.split('/')[1] !== 'gif'){
        setImage(file.path);
        getPalette(file.path, 5).then(({colors, amount}) => {
            console.log(colors, amount);
        });
    }
    dropbox.classList.toggle('drop-hover');
});

function setImage(src){
    const imageBox = document.getElementById('image-box');
    imageBox.innerHTML = `<img src="` + src + `" class="chosen-image">`;
}

function setPalette(colors, amount){
    let colorsContent = ``;
    let amountContent = ``;
    for(let i = 0; i < colors.count; i++){
        const color = colors[i];
        colorsContent += `<div class="" style="background-color: rgba(` + color[0] + `,` + color[1] + `,` + color[2] + `,` + (color[3] / 255)`);"></div>`;
    }
}

async function getPalette(src, colorNumber){
    const {colors, amount} = palette(await pixels(src), colorNumber);
    return {
        colors,
        amount
    }
}