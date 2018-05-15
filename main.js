const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let willQuitApp = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 540,
    // resizable: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL('https://ringcentral.github.io/ringcentral-embeddable-voice/app.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });
  mainWindow.on('close', (event) => {
    if (willQuitApp) {
      mainWindow = null;
      return;
    }
    event.preventDefault();
    mainWindow.hide();
  })
}

let notification;
app.on('ready', () => {
  createMainWindow();
});

app.on('before-quit', () => willQuitApp = true);

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('show-main-window', (e, data) => {
  mainWindow.show();
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
