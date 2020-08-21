const { ipcRenderer } = require('electron');
const fs = require('fs');
const remote = require('electron').remote;
const storageManager = remote.getGlobal('storage');
let books = [];
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
    addPrimaryFile.innerHTML = `
        <img src="../../assets/img/add-folder.svg" alt="">
        <a spellcheck="false">Add File</a>
    `;

    document.getElementById('folders').appendChild(addPrimaryFile);

    if(document.getElementsByClassName('name')[0]) setColors(0);

    document.getElementById('primary-file-add').addEventListener('click', () => {
        targetIndex = -1;
        document.getElementById('popup').classList.toggle('hide-file-name');
        document.getElementById('new-file-name').value = '';
        document.getElementById('new-file-name').focus();
    });

    document.getElementById('add-to-color-book').addEventListener('click', () => {
        ipcRenderer.send('toAddToColorBook', activeFileIndex);        
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
        <div class="folder ` + i + `` + hide + `">
            <div class="name">
                <img src="` + src + `" alt="">
                <a spellcheck="false">` + books[i][0] + `</a>
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
                if(clickCount !== 1) return;
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
            if(folder.parentElement.classList.contains('empty')) return;
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
            //const color = document.getElementsByClassName('color')[i].classList[1];
            //ipcRenderer.send('enableColorProperty', color);
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
    for(let i = 0; i < colors.length; i++){
        colorHtml += `<div draggable="true" class="color ` + i + `" style="background-color: ` + colors[i].colorHex + `;"></div>`;
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

    if(event.target == dropdownFolder     || dropdownFolder.contains(event.target)
        || event.target === dropdownColor || dropdownColor.contains(event.target) 
        || event.target == popup          || popup.contains(event.target)
        || event.target == deleteFile     || deleteFile.contains(event.target)) return;
    
    if(isMenuOpen) hideMenu();

    const folders = document.getElementsByClassName('name').length;

    for(let i = 0; i < folders; i++){
        if(event.target == document.getElementsByClassName('name')[i] || document.getElementsByClassName('name')[i].contains(event.target)) return;
    }
    checkForEditing();

    if(!popup.classList.contains('hide-file-name')) popup.classList.toggle('hide-file-name');
    if(!deleteFile.classList.contains('hide-popup-delete')) deleteFile.classList.toggle('hide-popup-delete');
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
    event = event || window.event;
    if(event.keyCode == 27){
        if(!popup.classList.contains('hide-popup-delete')) popup.classList.toggle('hide-popup-delete');
    }
    else if(event.keyCode == 13){
        if(popup.classList.contains('hide-popup-delete')) return;
        const path = colorPath(document.getElementsByClassName('name')[targetIndex].parentElement);
        storageManager.deleteFile(path);
        ipcRenderer.send('updateColorPickerStorage');
        initStorage();
        popup.classList.toggle('hide-popup-delete');
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
