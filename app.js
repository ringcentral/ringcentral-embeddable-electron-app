const { ipcRenderer } = require('electron');

const closeButton = document.getElementById('close');
const minimizeButton = document.getElementById('minimize');

closeButton.addEventListener('click', () => {
  ipcRenderer.send('close-main-window');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-main-window');
});
