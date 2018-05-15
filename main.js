const { app, BrowserWindow } = require('electron');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 540,
    // resizable: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      sandbox: true,
      preload: 'preload.js'
    }
  });
  mainWindow.loadURL('https://ringcentral.github.io/ringcentral-embeddable-voice/app.html');
}

app.on('ready', () => {
  createMainWindow();
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});
