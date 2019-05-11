const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

// console.log(process.versions);

function createMainWindow() {
  const sess = session.fromPartition('persist:rc-ev-session');
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 310,
    height: 540,
    resizable: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      session: sess,
      audio: true,
    },
    show: false, // hidden the windown before loaded
  });
  // open dev tool default
  // mainWindow.webContents.openDevTools();
  // To load RingCentral Embeddable Voice
  mainWindow.loadURL('https://ringcentral.github.io/ringcentral-embeddable/app.html?disableConferenceCall=false&disableActiveCallControl=false');
  // To use Game of Thrones Styles, please replace upper line as following line:
  // mainWindow.loadURL('https://ringcentral.github.io/ringcentral-embeddable/app.html?stylesUri=https://embbnux.github.io/ringcentral-web-widget-styles/GameofThrones/styles.css');

  // Show the main window when page is loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
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
