const remote = require('electron').remote;
const { ipcRenderer } = require('electron');
const storage = remote.getGlobal('storage');
const lodash = require('lodash');
let clickCount = 0;
let selectedFolderPath = [0];
let selectedFolderName = getSelectedFolderPathName();

ipcRenderer.on('updateColorPickerStorage', () => {
    let pathName = getSelectedFolderPathName();
    if(pathName) selectedFolderName = pathName;
    else {
        selectedFolderPath = [0];
        pathName = getSelectedFolderPathName();
        if(pathName) selectedFolderName = pathName;
        else{
            selectedFolderName = 'none';
            selectedFolderPath = [];
        } 
    }
    if(document.getElementById('save-color-popup').classList.contains('expand-popup')) generateHierarchy();
    else document.getElementById('folders').innerHTML = `<a>` + selectedFolderName + `</a>`;
});

document.getElementById('folders').innerHTML = `<a>` + selectedFolderName + `</a>`;

for (let i = 0; i < document.getElementsByClassName('expander').length; i++) {
    document.getElementsByClassName('expander')[i].addEventListener('click', (event) => {
        if (event.target != document.getElementsByClassName('expander')[i]) return;
        document.getElementById('save-color-popup').classList.toggle('expand-popup');
        document.getElementById('folders').classList.toggle('chosen-folder');
        if (document.getElementById('save-color-popup').classList.contains('expand-popup')) generateHierarchy();
        else document.getElementById('folders').innerHTML = `<a>` + selectedFolderName + `</a>`;
    });
}

document.getElementById('save-color-action').addEventListener('click', () => {
    const popup = document.getElementById('save-color-popup').classList;
    if(popup.contains('hide-popup')) popup.toggle('hide-popup');
    document.getElementById('color-name').value = '';
});

document.getElementById('save-color-button').addEventListener('click', () => {
    const popup = document.getElementById('save-color-popup').classList;
    const name = document.getElementById('color-name').value;
    const hex = document.getElementById('hex').value;
    storage.addColor(selectedFolderPath, name, hex);
    ipcRenderer.send('updateStorageWindow');
    if(!popup.contains('hide-popup')) popup.toggle('hide-popup');
});

document.getElementById('cancel-save-color-button').addEventListener('click', () => {
    const popup = document.getElementById('save-color-popup').classList;
    if(!popup.contains('hide-popup')) popup.toggle('hide-popup');
});

function generateHierarchy(){
    const folder = generateBooks(storage.getBooks(storage.storage.storage, lodash.cloneDeep(selectedFolderPath)), storage.getBooks(storage.storageCopy.storage)) + `
    <div class="add-folder" id="add-folder">
        <img class="add-folder-img" src="../../assets/img/add-folder.svg" alt="">
        <a spellcheck="false">Add File</a>
    </div>
    `;
    document.getElementById('folders').innerHTML = folder;
    folderHierarchy();
}

function generateBooks(books, bookCopy) {
    let folder = ``;
    for (let i = 0; i < books.length; i++) {
        let subFolders = ``;
        //console.log(books[i], bookCopy[i]);
        if (books[i][1].length > 0) subFolders = generateBooks(books[i][1], bookCopy[i][1]);
        const hide = (bookCopy[i][2] === true) ? `hide-sub-folders` : ``;
        const src = (bookCopy[i][2] === true) ? `../../assets/img/folder-close.svg` : `../../assets/img/folder-open.svg`;

        folder += `
        <div class="folder-item ` + i + `">
            <div class="name">
                <img src="` + src + `" alt="">
                <a class="` + ((books[i][3]) ? 'selected-folder' : '') + `" spellcheck="false">` + books[i][0] + `</a>
            </div>
            <div class="sub-folders ` + hide + `">` + 
                subFolders + 
                ` 
                <div class="add-folder">
                    <img class="add-folder-img" src="../../assets/img/add-folder.svg" alt="">
                    <a spellcheck="false">Add File</a>
                </div>
            </div>
        </div>
        `;
    }
    return folder;
}

function folderHierarchy() {
    hierarchyInputs();
}

function hierarchyInputs() {
    const books = document.getElementsByClassName('folder-item').length;
    const addFolderButtons = document.getElementsByClassName('add-folder').length;
    for (let i = 0; i < books; i++) bookInputs(i);
    for(let i = 0; i < addFolderButtons; i++) addFolderInput(i);
}

function bookInputs(index) {
    document.getElementsByClassName('name')[index].addEventListener('mousedown', (event) => {
        const folder = document.getElementsByClassName('folder-item')[index];
        clickCount++;
        if (clickCount === 1) {
            setTimeout(() => {
                if (clickCount !== 1) return;
                
                const oldSrc = folder.firstChild.nextSibling.firstChild.nextSibling.src;
                const newSrc = (folder.lastChild.previousSibling.classList.contains('hide-sub-folders')) ?
                    oldSrc.split('folder')[0] + 'folder-open.svg' :
                    oldSrc.split('folder')[0] + 'folder-close.svg';

                folder.lastChild.previousSibling.classList.toggle('hide-sub-folders');
                folder.firstChild.nextSibling.firstChild.nextSibling.src = newSrc;

                const path = colorPath(folder);
                //storage.toggleTemporaryState(booksCopy, path, (folder.lastChild.previousSibling.classList.contains('hide-sub-folders')));
                storage.toggleCopyState(path);
                
                clickCount = 0;
            }, 250);
        }
        else if (clickCount === 2) {
            clickCount = 0;
            selectedFolderPath = colorPath(folder);
            selectedFolderName = getSelectedFolderPathName();
            document.getElementById('save-color-popup').classList.toggle('expand-popup');
            document.getElementById('folders').classList.toggle('chosen-folder');
            document.getElementById('folders').innerHTML = `<a>` + selectedFolderName + `</a>`;
        }
    });
}

function addFolderInput(index){
    const addFolder = document.getElementsByClassName('add-folder')[index];
    addFolder.addEventListener('click', () => {
        const path = (addFolder.parentElement.parentElement.classList.contains('folder-item')) ? 
            colorPath(addFolder.parentElement.parentElement) :
            [];
        const folderInputDiv = document.createElement('div');
        folderInputDiv.className = 'folder-item';
        folderInputDiv.innerHTML = `
            <div class="name">
                <img src="../../assets/img/folder-close.svg" alt="">
                <a contentEditable="true" spellcheck="false" id="folder-input"></a>
            </div>        
        `;

        addFolder.parentElement.insertBefore(folderInputDiv, addFolder.parentElement.children[addFolder.parentElement.children.length-1]);
        
        const folderInput = document.getElementById('folder-input');
        folderInput.innerHTML = 'New Folder';
        folderInput.focus();
        selectText(folderInput);

        folderInput.addEventListener('keypress', (event) => {
            if(event.keyCode === 13){
                event.preventDefault();
                folderInput.blur();
                const name = folderInput.innerHTML;
                storage.addFile(path, name);
                addFolder.parentElement.removeChild(addFolder.parentElement.children[addFolder.parentElement.children.length-2]);
                ipcRenderer.send('updateStorageWindow');
                generateHierarchy();
            }
        });
    });
}

function getSelectedFolderPathName() {
    let path = '';

    let location = storage.storage.storage[selectedFolderPath[0]];
    for (let i = 0; i < selectedFolderPath.length; i++) {
        if(!location) return false;
        path += location.bookName + ((i < selectedFolderPath.length - 1) ? '/' : '');
        location = location.subBooks[selectedFolderPath[i + 1]];
    }

    return path;
}

function colorPath(element) {
    let path = [];

    if (element.parentElement.parentElement.classList.contains('folder-item')) {
        const parentPath = colorPath(element.parentElement.parentElement);
        parentPath.forEach(index => path.push(index));
    }

    path.push(Number(element.classList[1]));
    
    return path;
}

/* Miscs functions */
function selectText(element){
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}