const fs = require('fs');
const lodash = require('lodash');

let storage = readStorage();
let storageCopy = readStorage();

function readStorage(){
    if(!fs.existsSync('./data/storage.json')){
        fs.mkdirSync('./data');
        fs.writeFileSync('./data/storage.json', JSON.stringify({ storage: []}, null, 2));

        return {
            storage: []
        }
    }
    return JSON.parse(fs.readFileSync('./data/storage.json', 'utf-8'));
}

function writeStorage(){
    if(readStorage() === storage) return;
    fs.writeFileSync('./data/storage.json', JSON.stringify(storage, null, 2));
}

/* File functions */

function addFile(path, name){
    const newFile = {
        bookName: name,
        subBooks: [],
        colors: [],
        isHidden: true
    };
    if(path.length > 0){
        let location = storage.storage[path[0]];
        for(let i = 1; i < path.length; i++){
            location = location.subBooks[path[i]];
        }
        location.subBooks.push(newFile);
        location.isHidden = false;
    }
    else{
        storage.storage.push(newFile);
    }
    addCopyFile(path, name);
}

function addCopyFile(path, name){
    const newFile = {
        bookName: name,
        subBooks: [],
        colors: [],
        isHidden: true
    };
    if(path.length > 0){
        let location = storageCopy.storage[path[0]];
        for(let i = 1; i < path.length; i++){
            location = location.subBooks[path[i]];
        }
        location.subBooks.push(newFile);
    }
    else{
        storageCopy.storage.push(newFile);
    }
}

function changeFileName(path, name){
    let location = storage.storage[path[0]];
    let locationCopy = storageCopy.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
        locationCopy = locationCopy.subBooks[path[i]];
    }
    location.bookName = name;
    locationCopy.bookName = name;
}

function changeFileState(path, state){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }
    location.isHidden = state;
}

function toggleFileState(path){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }
    location.isHidden = (location.isHidden) ? false : true;
}

function moveFolder(folderPath, newPath){
    let location = storage.storage[folderPath[0]];
    let folder = storage.storage[folderPath[0]];
    if(folderPath.length > 1){
        for(let i = 1; i < folderPath.length - 1; i++){
            location = location.subBooks[folderPath[i]];
        }
        folder = location.subBooks[folderPath[folderPath.length - 1]];
        location.subBooks.splice(folderPath[folderPath.length - 1], 1);
    }
    else{
        storage.storage.splice(folderPath[0], 1);
    }

    if(newPath === -1){
        storage.storage.push(folder);
        moveCopy(folderPath, newPath);
        return;
    }

    location = storage.storage[newPath[0]];
    if(newPath.length > 1){
        for(let i = 1; i < newPath.length; i++){
            location = location.subBooks[newPath[i]];
        }
    }
    location.subBooks.push(folder);
    moveCopy(folderPath, newPath);
}

function moveCopy(folderPath, newPath){
    let location = storageCopy.storage[folderPath[0]];
    let folder = storageCopy.storage[folderPath[0]];
    if(folderPath.length > 1){
        for(let i = 1; i < folderPath.length - 1; i++){
            location = location.subBooks[folderPath[i]];
        }
        folder = location.subBooks[folderPath[folderPath.length - 1]];
        location.subBooks.splice(folderPath[folderPath.length - 1], 1);
    }
    else{
        storageCopy.storage.splice(folderPath[0], 1);
    }

    if(newPath === -1){
        storageCopy.storage.push(folder);
        return;
    }

    location = storageCopy.storage[newPath[0]];
    if(newPath.length > 1){
        for(let i = 1; i < newPath.length; i++){
            location = location.subBooks[newPath[i]];
        }
    }
    location.subBooks.push(folder);
}

function deleteFile(path){
    if(path.length === 1){
        storage.storage.splice(path[0], 1);
        storageCopy.storage.splice(path[0], 1);
        return;
    }

    let location = storage.storage[path[0]];
    let locationCopy = storageCopy.storage[path[0]];
    for(let i = 1; i < path.length - 1; i++){
        location = location.subBooks[path[i]];
        locationCopy = locationCopy.subBooks[path[i]];
    }
    location.subBooks.splice(path[path.length - 1], 1);
    locationCopy.subBooks.splice(path[path.length - 1], 1);
}

function getBooks(subBooks, path){
    let books = [];
    for(let i = 0; i < Object.keys(subBooks).length; i++){
        let selected = false;
        if(path && path.length === 1 && path[0] === i){
            selected = (path && path.length === 1 && path[0] === i);
            path.shift();
        }
        if(!selected && path && path[0] === i) path.shift();
        const container = [subBooks[i].bookName, getBooks(subBooks[i].subBooks, path), subBooks[i].isHidden, selected];
        books.push(container);
    }
    return books;
}

/* Color functions */

function getColors(path){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }
    
    const colors = Object.values(location.colors);
    return colors;
}

function getColor(path, index){
    let location = storage.storage[path[0]];
    if(path.length > 1){
        for(let i = 1; i < path.length; i++) location = location.subBooks[path[i]];
    }
    
    return {
        book: location,
        color: location.colors[index]
    };
}

function addColor(path, name, color){
    const newColor = {
        colorName: name,
        colorHex: color
    };

    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }

    location.colors.push(newColor);
}

function updateColor(path, colorIndex, color){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }

    location.colors[colorIndex].colorHex = color;
}

function changeColorName(path, colorIndex, name){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }

    location.color[colorIndex].colorName = name;
}

function moveColor(initialPath, newPath, colorIndex){
    let location = storage.storage[initialPath[0]];
    for(let i = 1; i < initialPath.length; i++){
        location = location.subBooks[initialPath[i]];
    }

    const color = location.colors[colorIndex];
    location.colors.splice(colorIndex, 1);

    location = storage.storage[newPath[0]];
    for(let i = 1; i < newPath.length; i++){
        location = location.subBooks[newPath[i]];
    }

    location.colors.push(color);
}

function deleteColor(path, colorIndex){
    let location = storage.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }

    location.colors.splice(colorIndex, 1);
}

/* Function of the custom hierarchy saver if the color picker window */

function toggleCopyState(path){
    let location = storageCopy.storage[path[0]];
    for(let i = 1; i < path.length; i++){
        location = location.subBooks[path[i]];
    }
    location.isHidden = (location.isHidden) ? false : true;
}

module.exports = {
    storage,
    storageCopy,
    readStorage,
    writeStorage,
    addFile,
    changeFileName,
    changeFileState,
    toggleFileState,
    toggleCopyState,
    moveFolder,
    deleteFile,
    getColors,
    getColor,
    addColor,
    updateColor,
    changeColorName,
    deleteColor,
    getBooks,
    moveColor
};