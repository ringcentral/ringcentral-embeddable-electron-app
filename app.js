const { ipcRenderer } = require('electron');

const closeButton = document.getElementById('close');
const minimizeButton = document.getElementById('minimize');

const webview = document.querySelector('webview');

closeButton.addEventListener('click', () => {
  ipcRenderer.send('close-main-window');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-main-window');
});

// webview.addEventListener('new-window', (event) => {
//   event.preventDefault();
// });

// transfer message from main process to webview
ipcRenderer.on('main-message', function (e, message) {
  webview.send('main-message', message);
});
