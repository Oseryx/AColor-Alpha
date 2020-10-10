const mainBox = document.getElementById('mainBox');

document.getElementById('color-wheel-button').addEventListener('click', () => {
    mainBox.style.setProperty('left', '0%');
});
document.getElementById('extractor-image-button').addEventListener('click', () => {
    mainBox.style.setProperty('left', '-100%');
});