const { ipcRenderer, BrowserWindow } = require('electron');

const closeButton = document.getElementById('close');
const minimizeButton = document.getElementById('minimize');

const webview = document.querySelector('webview');

closeButton.addEventListener('click', () => {
  ipcRenderer.send('close-main-window');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-main-window');
});

webview.getWebContents().on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
  event.preventDefault();
  event.newGuest = new BrowserWindow({
    ...options,
    frame: true,
    autoHideMenuBar: true,
    partition: 'persist:rcstorage',
    modal: true,
  });
});
