const { app, BrowserWindow, ipcMain } = require('electron');
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  console.warn('App already running');
	app.quit();
  return;
}

let mainWindow;

// console.log(process.versions);

function createMainWindow() {
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 300,
    height: 536,
    resizable: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      partition: 'persist:rcstorage',
      webviewTag: true,
      // enableRemoteModule: true,
    },
    frame: false,
    show: false, // hidden the windown before loaded
    icon: __dirname + '/icons/32x32.png',
  });
  // open dev tool default
  if (process.env.DEBUG == 1) {
    mainWindow.webContents.openDevTools();
  }
  // To load RingCentral Embeddable
  mainWindow.loadFile('./app.html');

  // Show the main window when page is loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    mainWindow = null
  });
}

app.on('second-instance', () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

app.on('ready', () => {
  createMainWindow();
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  mainWindow = null;
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

ipcMain.on('show-main-window', () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.focus();
    return
  }
  mainWindow.show();
});

ipcMain.on('minimize-main-window', () => {
  if (!mainWindow.isMinimized()) {
    mainWindow.minimize();
  }
});

ipcMain.on('close-main-window', () => {
  if (!mainWindow) {
    return;
  }
  mainWindow.close();
});
