const { ipcRenderer } = require('electron');
const fs = require('fs');
const remote = require('electron').remote;
const storageManager = remote.getGlobal('storage');
let isDragging = false;
let books = [];
let activeFilePath = [];
let targetMovedFolderPath = [];
let targetMovedColor = -1;
let clickCount = 0;
let isMenuOpen = false;
let isRenaming = false;
let targetIndex = 0;
let targetColor = 0;
let activeFileIndex = 0;

initStorage();

ipcRenderer.on('updateStorage', initStorage);

//To rechek
function initStorage(){
    const storage = storageManager.storage;
    books = getBooks(Object.values(storage.storage));
    document.getElementById('folders').innerHTML = generateBooks(storageManager.getBooks(Object.values(storage.storage)));
    setTree();

    const addPrimaryFile = document.createElement('div');
    addPrimaryFile.id = `primary-file-add`;
    addPrimaryFile.className = `primary-file-add`;
    addPrimaryFile.innerHTML = `
        <img class="primary-file-add-icon" src="../../assets/img/add-folder.svg" alt="">
        <a class="primary-file-add-name" spellcheck="false">Add File</a>
    `;

    document.getElementById('folders').appendChild(addPrimaryFile);

    if(document.getElementsByClassName('name')[activeFileIndex]){
        activeFilePath = [0];
        activeFileIndex = 0;
        setColors(activeFileIndex);
        
        document.getElementById('add-to-color-book').addEventListener('click', () => {
            ipcRenderer.send('toAddToColorBook', activeFileIndex);        
        });
    } 

    document.getElementById('primary-file-add').addEventListener('click', () => {
        targetIndex = -1;
        document.getElementById('popup').classList.toggle('hide-file-name');
        document.getElementById('new-file-name').value = '';
        document.getElementById('new-file-name').focus();
    });

}

//Cheked
function getBooks(subBooks){
    let array = [];
    for(let i = 0; i < Object.keys(subBooks).length; i++){
        const container = [subBooks[i].bookName, getBooks(subBooks[i].subBooks), subBooks[i].isHidden];
        array.push(container);
    }
    return array;
}

//Cheked
function generateBooks(books){
    let folder = ``;
    for(let i = 0; i < books.length; i++){
        let subFolders = ``;

        if(books[i][1].length > 0){
            subFolders = generateBooks(books[i][1]);
        }
        else{
            subFolders += `
            <div class="folder empty">
                <img src="../../assets/img/empty.svg" alt="">
                <a>No sub-folders</a>
            </div>
            `;
        }

        const hide = (books[i][2] === true) ? ` hide` : ``;
        const src = (books[i][2] === true) ? `../../assets/img/folder-close.svg` : `../../assets/img/folder-open.svg`;

        folder += `
        <div draggable="true" class="folder ` + i + `` + hide + `">
            <div class="name">
                <img class="folder-name-icon" src="` + src + `" alt="">
                <a class="folder-name-text" spellcheck="false">` + books[i][0] + `</a>
            </div>
            <div class="sub-folders">` + subFolders + `</div>
        </div>
        `;
    }
    return folder;
}

//Cheked
function setTree(){
    const folders = document.getElementsByClassName('name').length;
    for(let i = 0; i < folders; i++) hierarchyInputs(i);
}

//Cheked
function hierarchyInputs(index){
    const folder = document.getElementsByClassName('name')[index];
    const path = colorPath(document.getElementsByClassName('name')[index].parentElement);
    folder.addEventListener('mousedown', (event) =>{
        if(event.button === 2) return;
        clickCount++;
        if(clickCount === 1){
            setTimeout(() => {
                if(clickCount !== 1 || isDragging) return;
                const oldSrc = folder.firstChild.nextSibling.src;
        
                if(folder.parentElement.classList.contains('folder')){
                    folder.parentElement.classList.toggle('hide');
                }

                const newSrc = (folder.parentElement.classList.contains('hide')) ?
                      oldSrc.split('folder')[0] + 'folder-close.svg' :
                      oldSrc.split('folder')[0] + 'folder-open.svg';
                
                folder.firstChild.nextSibling.src = newSrc;

                storageManager.toggleFileState(path);

                clickCount = 0;
            }, 250);
        }
        else if(clickCount === 2){
            if(folder.parentElement.classList.contains('empty') || isDragging) return;
            activeFilePath = colorPath(folder.parentElement);
            setColors(index);
            clickCount = 0;
        }
    });
    folder.addEventListener('contextmenu', (event) => {
        isMenuOpen = true;
        if(isMenuOpen){
            targetIndex = index;
            const mouseDropDown = document.getElementById('mouse-dropdown');
            const bounds = document.getElementById("body").getBoundingClientRect();
            const x = event.clientX - bounds.left + 5;
            const y = event.clientY - bounds.top + 5;

            mouseDropDown.classList.toggle('hide-menu');
            mouseDropDown.style.top = y + "px";
            mouseDropDown.style.left = x + "px";
        }
    });
    folder.addEventListener('keypress', (event) => {
        if(event.keyCode === 13){
            event.preventDefault();
            folder.lastElementChild.blur();
            if(isRenaming){
                checkForEditing();
                ipcRenderer.send('updateColorPickerStorage');
                storageManager.changeFileName(path, folder.lastElementChild.innerHTML);
                isRenaming = false;
            }
        }
    });
    folder.addEventListener('keydown', (event) => {
        event = event || window.event;
        if(event.keyCode == 27){
            event.preventDefault();
            folder.lastElementChild.blur();
            if(isRenaming){
                storageManager.changeFileName(path, folder.lastElementChild.innerHTML);
                checkForEditing();
                isRenaming = false;
            }
        }
    });
}

document.addEventListener('dragover', (event) => {
    event.preventDefault();
}, false);

document.addEventListener('dragleave', () => {
    isDragging = false;
    clickCount = 0;
}, false);

document.addEventListener('dragend', () => {
    isDragging = false;
    clickCount = 0;
});

document.addEventListener('drop', (event) => {
    if(isMenuOpen) return;
    const target = event.target;
    if(targetMovedColor !== -1){
        //console.log('Color !');
        if(target.classList.contains('folder') || target.classList.contains('name') || target.classList.contains('folder-name-text') || target.classList.contains('folder-name-icon')){
            let parent = -1;
            if(target.classList.contains('folder')) parent = target;
            else if(target.parentElement.classList.contains('folder')) parent = target.parentElement;
            else if(target.parentElement.parentElement.classList.contains('folder')) parent = target.parentElement.parentElement;
            else return;
            
            const parentPath = colorPath(parent);
            
            storageManager.moveColor(activeFilePath, parentPath, targetMovedColor);
            setColors(activeFileIndex);
            
            targetMovedColor = -1;
        }
    }
    else {
        if(target.classList.contains('folder') || target.classList.contains('name') || target.classList.contains('folder-name-text') || target.classList.contains('folder-name-icon')){
            let parent = -1;
            if(target.classList.contains('folder')) parent = target;
            else if(target.parentElement.classList.contains('folder')) parent = target.parentElement;
            else if(target.parentElement.parentElement.classList.contains('folder')) parent = target.parentElement.parentElement;
            else return;
            
            const parentPath = colorPath(parent);
            //console.log(targetMovedFolderPath, parentPath);
            //console.log(checkIsParent(targetMovedFolderPath,parentPath));
            if(checkIsChild(targetMovedFolderPath, parentPath) || checkIsParent(targetMovedFolderPath, parentPath)) return;

            storageManager.moveFolder(targetMovedFolderPath, parentPath);
            ipcRenderer.send('updateColorPickerStorage');
            initStorage();
        }
        else if(target.classList.contains('folders') || target.classList.contains('primary-file-add') || target.classList.contains('primary-file-add-icon') || target.classList.contains('primary-file-add-name')) {
            //console.log('main tree !');
            if(targetMovedFolderPath.length === 1) return;
            //console.log(targetMovedFolderPath);
            storageManager.moveFolder(targetMovedFolderPath, -1);
            ipcRenderer.send('updateColorPickerStorage');
            initStorage();
        }
    }
    isDragging = false;
    clickCount = 0;
});

document.addEventListener('drag',() => {isDragging = true;});

document.addEventListener('dragstart', (event) => {
    isDragging = true;
    const target = event.target;
    if(target.classList.contains('color')) targetMovedColor = Number(target.classList[1]);
    else {
        if(target.classList.contains('folder')) targetMovedFolderPath = colorPath(event.target);
        else if(event.target.parentElement.classList.contains('folder')) targetMovedFolderPath = colorPath(event.target.parentElement);
        else if(event.target.parentElement.parentElement.classList.contains('folder')) targetMovedFolderPath = colorPath(event.target.parentElement.parentElement);
    } 
});

function checkIsChild(targetFolderPath, parentPath){
    if(targetFolderPath.length === parentPath.length + 1 || targetFolderPath.length === parentPath.length){
        for(let i = 0; i < parentPath.length; i++){
            if(targetFolderPath[i] !== parentPath[i]) return false;
        }
        return true;
    }
    return false;
}

function checkIsParent(targetFolderPath, childPath){
    if(targetFolderPath.length + 1 <= childPath.length){
        for(let i = 0; i < targetFolderPath.length; i++){
            if(targetFolderPath[i] !== childPath[i]) return false;
        }
        return true;
    }
    return false;
}

//Cheked
function hideMenu(){
    const fileDropdown = document.getElementById('mouse-dropdown')
    const colorDropdown = document.getElementById('color-mouse-dropdown');

    if(!fileDropdown.classList.contains('hide-menu')) fileDropdown.classList.toggle('hide-menu');
    if(!colorDropdown.classList.contains('hide-menu')) colorDropdown.classList.toggle('hide-menu');

    isMenuOpen = false;
}

//Cheked
function checkForEditing(){
    const folders = document.getElementsByClassName('name').length;

    for(let i = 0; i < folders; i++) document.getElementsByClassName('name')[i].lastElementChild.contentEditable = false;
    isRenaming = false;
}

/*
    COLOR FUNCTIONS
*/

//Cheked
function colorEvents(){
    for(let i = 0; i < document.getElementsByClassName('color').length; i++){
        document.getElementsByClassName('color')[i].addEventListener('click', () => {
            const array = colorPath(document.getElementsByClassName('name')[activeFileIndex].parentElement);
            ipcRenderer.send('enableColorProperty', array, i);
        });
    }
}

//Cheked
function setColors(index){
    const path = colorPath(document.getElementsByClassName('name')[index].parentElement);
    //const colors = getJsonPath(array);
    const colors = storageManager.getColors(path);
    activeFileIndex = index;
    
    let colorHtml = ``;
    for(let i = 0; i < colors.length; i++){ //style="border: 5px ` + colors[i].colorHex + ` solid;"
        colorHtml += `<div draggable="true" class="color ` + i + `">
            <div class="color-color" style="background-color: ` + colors[i].colorHex + `;"></div>
        </div>`;
    }
    colorHtml += `<div class="color-add" id="add-to-color-book"><a>+</a></div>`;

    document.getElementById('colors').innerHTML = colorHtml;
    colorEvents();

    //Color Inputs
    for(let i = 0; i < colors.length; i++) colorInputs(i);
}

function colorPath(element) {
    let path = [];

    if (element.parentElement.parentElement.classList.contains('folder')) {
        const parentPath = colorPath(element.parentElement.parentElement);
        parentPath.forEach(index => path.push(index));
    }

    path.push(Number(element.classList[1]));
    
    return path;
}

function colorInputs(index){
    const color = document.getElementsByClassName('color')[index];
    const dropdown = document.getElementById('color-mouse-dropdown');
    color.addEventListener('contextmenu', (event) => {
        const bounds = document.getElementById("body").getBoundingClientRect();
        const x = event.clientX - bounds.left + 5;
        const y = event.clientY - bounds.top + 5;

        dropdown.classList.toggle('hide-menu');
        dropdown.style.top = y + "px";
        dropdown.style.left = x + "px";

        isMenuOpen = true;
        targetColor = index;
    });
}

//Cheked
document.addEventListener('mousedown', (event) => {
    const dropdownFolder = document.getElementById('mouse-dropdown');
    const dropdownColor = document.getElementById('color-mouse-dropdown')
    const popup = document.getElementById('popup');
    const deleteFile = document.getElementById('delete-file-popup');
    const colorDelete = document.getElementById('delete-color-popup');

    if(event.target == dropdownFolder     || dropdownFolder.contains(event.target)
        || event.target === dropdownColor || dropdownColor.contains(event.target) 
        || event.target == popup          || popup.contains(event.target)
        || event.target == deleteFile     || deleteFile.contains(event.target)
        || event.target == colorDelete    || colorDelete.contains(event.target)) return;
    
    if(isMenuOpen) hideMenu();

    const folders = document.getElementsByClassName('name').length;

    for(let i = 0; i < folders; i++){
        if(event.target == document.getElementsByClassName('name')[i] || document.getElementsByClassName('name')[i].contains(event.target)) return;
    }
    checkForEditing();

    if(!popup.classList.contains('hide-file-name')) popup.classList.toggle('hide-file-name');
    if(!deleteFile.classList.contains('hide-popup-delete')) deleteFile.classList.toggle('hide-popup-delete');
    if(!colorDelete.classList.contains('hide-popup-delete')) colorDelete.classList.toggle('hide-popup-delete');
});

//Cheked
document.getElementById('add-file').addEventListener('click', (event) => {
    hideMenu();
    document.getElementById('popup').classList.toggle('hide-file-name');
    document.getElementById('new-file-name').value = '';
    document.getElementById('new-file-name').focus();
});

//Cheked
document.getElementById('new-file-name').addEventListener('keydown', (event) => {
    const popup = document.getElementById('popup');
    event = event || window.event;
    if(event.keyCode == 27){
        if(popup.classList.contains('hide-file-name')) return; 
        else popup.classList.toggle('hide-file-name');
    }
    else if(event.keyCode == 13){
        if(popup.classList.contains('hide-file-name')) return;
        const fileName = document.getElementById('new-file-name').value;
        
        popup.classList.toggle('hide-file-name');

        if(fileName == '') return;
        
        const path = (targetIndex === -1) ? [] : colorPath(document.getElementsByClassName('name')[targetIndex].parentElement);
        storageManager.addFile(path, fileName);
        ipcRenderer.send('updateColorPickerStorage');
        initStorage();
    }
});

//Cheked
document.getElementById('rename-file').addEventListener('click', () => {
    isRenaming = true;
    hideMenu();
    
    document.getElementsByClassName('name')[targetIndex].lastElementChild.contentEditable = true;
    document.getElementsByClassName('name')[targetIndex].lastElementChild.focus();
});

//Cheked
document.getElementById('body').addEventListener('keydown', (event) => {
    const popup = document.getElementById('delete-file-popup');
    const colorDelete = document.getElementById('delete-color-popup');
    event = event || window.event;
    if(event.keyCode == 27){
        if(!popup.classList.contains('hide-popup-delete')) popup.classList.toggle('hide-popup-delete');
        if(!colorDelete.classList.contains('hide-popup-delete')) colorDelete.classList.toggle('hide-popup-delete');
    }
    else if(event.keyCode == 13){
        if(!popup.classList.contains('hide-popup-delete')){
            popup.classList.toggle('hide-popup-delete');
            const path = colorPath(document.getElementsByClassName('name')[targetIndex].parentElement);
            storageManager.deleteFile(path);
            ipcRenderer.send('updateColorPickerStorage');
            initStorage();
        }
        if(!colorDelete.classList.contains('hide-popup-delete')){
            colorDelete.classList.toggle('hide-popup-delete');
            const path = colorPath(document.getElementsByClassName('name')[activeFileIndex].parentElement);
            storageManager.deleteColor(path, targetColor);
            setColors(activeFileIndex);
        }
    }
});

//Cheked
document.getElementById('delete').addEventListener('click', () => {
    hideMenu();
    document.getElementById('delete-file-popup').classList.toggle('hide-popup-delete');
    document.getElementById('delete-file-popup').focus();
});

//Cheked
document.getElementById('cancel-delete').addEventListener('click', () => {
    const deleteFile = document.getElementById('delete-file-popup');
    if(deleteFile.classList.contains('hide-popup-delete')) return;
    deleteFile.classList.toggle('hide-popup-delete');
});

//Cheked
document.getElementById('delete-file').addEventListener('click', () => {
    const popup = document.getElementById('delete-file-popup');
    if(popup.classList.contains('hide-popup-delete')) return;

    const path = colorPath(document.getElementsByClassName('name')[targetIndex].parentElement);
    storageManager.deleteFile(path);
    ipcRenderer.send('updateColorPickerStorage');
    initStorage();
    popup.classList.toggle('hide-popup-delete');
});

/*
    Color events
*/

document.getElementById('delete-color').addEventListener('click', () =>{
    hideMenu();
    document.getElementById('delete-color-popup').classList.toggle('hide-popup-delete');
});

document.getElementById('cancel-delete-color').addEventListener('click', () => {
    document.getElementById('delete-color-popup').classList.toggle('hide-popup-delete');
});

document.getElementById('delete-color-button').addEventListener('click', () => {
    const path = colorPath(document.getElementsByClassName('name')[activeFileIndex].parentElement);
    storageManager.deleteColor(path, targetColor);
    setColors(activeFileIndex);
    document.getElementById('delete-color-popup').classList.toggle('hide-popup-delete');
});

document.getElementById('edit-color').addEventListener('click', () => {
    const array = colorPath(document.getElementsByClassName('name')[activeFileIndex].parentElement);
    hideMenu();
    ipcRenderer.send('enableColorProperty', array, targetColor);
});

/*
    Electron events
*/

ipcRenderer.on('refreshRequired', () => {
    setColors(activeFileIndex);
});
