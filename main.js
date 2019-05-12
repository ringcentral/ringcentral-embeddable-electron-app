const { app, BrowserWindow, ipcMain, session } = require('electron');

let mainWindow;

// console.log(process.versions);

function createMainWindow() {
  const sess = session.fromPartition('persist:rcstorage');
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 300,
    height: 536,
    resizable: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      session: sess,
      webviewTag: true,
    },
    frame: false,
    show: false, // hidden the windown before loaded
  });
  // open dev tool default
  // mainWindow.webContents.openDevTools();
  // To load RingCentral Embeddable
  mainWindow.loadFile('./app.html');

  // Show the main window when page is loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
  //   event.preventDefault();
  //   event.newGuest = new BrowserWindow({
  //     ...options,
  //     frame: true,
  //     parent: mainWindow,
  //     autoHideMenuBar: true,
  //     session: sess,
  //   });
  // });
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow = null
    } else {
      event.preventDefault()
      mainWindow.hide()
    }
  });
}

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
  mainWindow.hide();
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

app.on('before-quit', () => {
  app.quitting = true;
});
