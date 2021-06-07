const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, BrowserView, shell } = require('electron');
const singleInstanceLock = app.requestSingleInstanceLock();

const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')));
let rcClientId;
let rcServer;
const apiConfigFile = path.resolve(__dirname, 'api.json');
if (fs.existsSync(apiConfigFile)) {
  const apiConfig = JSON.parse(fs.readFileSync(apiConfigFile));
  rcClientId = apiConfig.ringcentralClientId;
  rcServer = apiConfig.ringcentralServer;
}

if (!singleInstanceLock) {
  console.warn('App already running');
	app.quit();
  return;
}

let mainWindow;
let mainView;
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
      contextIsolation: false,
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
    mainWindow = null;
    mainView = null;
    numberToDialer = null;
    dialerReady = false;
  });
  mainView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nativeWindowOpen: true,
      partition: 'persist:rcstorage',
      preload: path.resolve(__dirname, './preload.js'),
    },
  });
  mainWindow.setBrowserView(mainView);
  mainView.setBounds({ x: 0, y: 36, width: 300, height: 500 });
  mainView.setAutoResize({ width: true, height: true });
  let appUrl = 'https://ringcentral.github.io/ringcentral-embeddable/app.html';
  appUrl = `${appUrl}?appVersion=${version}&userAgent=RingCentralEmbeddableForLinux/${version}`;
  if (rcClientId) {
    appUrl = `${appUrl}&clientId=${rcClientId}`;
  }
  if (rcServer) {
    appUrl = `${appUrl}&appServer=${rcServer}`;
  }
  mainView.webContents.loadURL(appUrl);
  mainView.webContents.setWindowOpenHandler((event) => {
    const { url } = event;
    if (url.indexOf('authorize') > -1) {
      return { action: 'allow' };
    }
    if (url.indexOf('http') > -1) {
      shell.openExternal(url);
      return { action: 'deny' }
    }
    return { action: 'allow' };
  });
  // open dev tool default
  if (process.env.DEBUG == 1) {
    mainView.webContents.openDevTools();
  }
}

function sendMessageToMainView(message) {
  if (!mainView) {
    return;
  }
  mainView.webContents.send('main-message', message)
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
    sendMessageToMainView({ type: 'click-to-sms', phoneNumber: number });
  } else {
    if (dialerReady) {
      sendMessageToMainView({ type: 'click-to-dial', phoneNumber: number });
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
  mainView = null;
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
    sendMessageToMainView({
      type: 'click-to-dial',
      phoneNumber: numberToDialer
    });
    numberToDialer = null;
  }
});

ipcMain.on('set-environment', () => {
  sendMessageToMainView({
    type: 'rc-adapter-set-environment',
  });
});
