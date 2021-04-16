const { ipcRenderer } = require('electron');

const closeButton = document.getElementById('close');
const minimizeButton = document.getElementById('minimize');
const hiddenButton = document.getElementById('hidden-button');
const webview = document.querySelector('webview');

closeButton.addEventListener('click', () => {
  ipcRenderer.send('close-main-window');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-main-window');
});

hiddenButton.addEventListener('dblclick', () => {
  webview.send('main-message', {
    type: 'rc-adapter-set-environment',
  });
});

// webview.addEventListener('new-window', (event) => {
//   event.preventDefault();
// });

// transfer message from main process to webview
ipcRenderer.on('main-message', function (e, message) {
  webview.send('main-message', message);
});
