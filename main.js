const { app, BrowserWindow, ipcMain } = require('electron');
const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  console.warn('App already running');
	app.quit();
  return;
}

let mainWindow;
let numberToDialer = null;
let dialerReady = false;

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
    numberToDialer = null;
    dialerReady = false;
  });
}

function sendMessageToMainWindow(message) {
  if (!mainWindow) {
    return;
  }
  mainWindow.webContents.send('main-message', message)
}

const protocols = ['tel', 'callto', 'sms'];
function handleCustomizedSchemeUri(url) {
  if (!url) {
    return;
  }
  const protocol = url.split(':')[0];
  let number = url.split(':')[1];
  if (!number) {
    return;
  }
  if (protocols.indexOf(protocol) === -1) {
    return;
  }
  number = number.replace('//', '');
  if (!number) {
    return;
  }
  if (protocol === 'sms') {
    sendMessageToMainWindow({ type: 'click-to-sms', phoneNumber: number });
  } else {
    if (dialerReady) {
      sendMessageToMainWindow({ type: 'click-to-dial', phoneNumber: number });
      numberToDialer = null;
    } else {
      numberToDialer = number;
    }
  }
}

app.on('second-instance', (e, commandLine, cwd) => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
  commandLine.forEach(cmd => {
    handleCustomizedSchemeUri(cmd);
  });
});

app.on('ready', () => {
  createMainWindow();
  process.argv.forEach((cmd) => {
    handleCustomizedSchemeUri(cmd);
  });
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  mainWindow = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function showMainWindow() {
// On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
}

app.on('activate', () => {
  showMainWindow();
});

app.setAsDefaultProtocolClient('tel');
app.setAsDefaultProtocolClient('callto');
app.setAsDefaultProtocolClient('sms');
// for macOS
app.on('open-url', function (event, url) {
  event.preventDefault();
  showMainWindow();
  handleCustomizedSchemeUri(url);
});

app.on('browser-window-created', (_, window) => {
  window.setMenu(null);
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
  dialerReady = false;
  numberToDialer = null;
  mainWindow.close();
});

ipcMain.on('dialer-ready', () => {
  dialerReady = true;
  if (numberToDialer) {
    sendMessageToMainWindow({
      type: 'click-to-dial',
      phoneNumber: numberToDialer
    });
    numberToDialer = null;
  }
});
