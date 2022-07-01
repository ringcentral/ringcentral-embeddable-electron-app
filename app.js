const { ipcRenderer } = require('electron');

const closeButton = document.getElementById('close');
const minimizeButton = document.getElementById('minimize');
const hiddenButton = document.getElementById('hidden-button');

closeButton.addEventListener('click', () => {
  ipcRenderer.send('close-main-window');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-main-window');
});

hiddenButton.addEventListener('dblclick', () => {
  ipcRenderer.send('set-environment');
});

if (window.location.search.indexOf('useSystemMenu') > -1) {
  closeButton.style = 'display: none;';
  minimizeButton.style = 'display: none;';
}
