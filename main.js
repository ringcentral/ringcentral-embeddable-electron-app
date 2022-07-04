const path = require('path');
const fs = require('fs');
const {
  app,
  BrowserWindow,
  ipcMain,
  BrowserView,
  shell,
  Menu,
  Tray,
} = require('electron');
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
let useSystemMenu = false;
const appConfigPath = path.resolve(app.getPath('home'), '.rc-embeddable-app');
if (!fs.existsSync(appConfigPath)) {
  fs.mkdirSync(appConfigPath);
}
const useSystemMenuFile = path.resolve(appConfigPath, '.useSystemMenu');
if (fs.existsSync(useSystemMenuFile)) {
  useSystemMenu = true;
}

let mainWindow;
let mainView;
let tray;
let numberToDialer = null;
let dialerReady = false;
let isQuiting;

// console.log(process.versions);

function createTray() {
  const iconPath = path.join(__dirname, 'icons', '16x16.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App', click: () => {
        showMainWindow();
      }
    },
    {
      label: 'Quit', click: () => {
        app.quit();
      }
    },
  ]);
  tray.setToolTip('RingCentral Phone (Community)');
  tray.setContextMenu(contextMenu);
}

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
    frame: useSystemMenu ? true : false,
    show: false, // hidden the windown before loaded
    icon: path.join(__dirname, 'icons', '48x48.png'),
  });
  // open dev tool default
  if (process.env.DEBUG == 1) {
    mainWindow.webContents.openDevTools();
  }
  // To load RingCentral Embeddable
  let localAppUrl = `file://${__dirname}/app.html`;
  if (useSystemMenu) {
    localAppUrl = `${localAppUrl}?useSystemMenu=1`
  }
  mainWindow.loadURL(localAppUrl);

  // Show the main window when page is loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      event.returnValue = false;
      return;
    }
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
  mainView.setBounds({ x: 0, y: 37, width: 300, height: 500 });
  mainView.setAutoResize({ width: true, height: true });
  let appUrl = 'https://ringcentral.github.io/ringcentral-embeddable/app.html';
  appUrl = `${appUrl}?appVersion=${version}&userAgent=RingCentralEmbeddableForLinux/${version}&enableRingtoneSettings=1`;
  if (rcClientId) {
    appUrl = `${appUrl}&clientId=${rcClientId}`;
  }
  if (rcServer) {
    appUrl = `${appUrl}&appServer=${rcServer}`;
    if (rcServer.indexOf('discovery') > -1) {
      appUrl = `${appUrl}&discovery=1`;
    }
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
  const onInputEvent = (event, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === 'q') {
      console.log('Pressed Control/Command+Q')
      app.quit();
    }
    if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'm') {
      console.log('Pressed Control/Command+Shift+M');
      useSystemMenu = !useSystemMenu;
      if (useSystemMenu) {
        fs.writeFileSync(useSystemMenuFile, '1');
      } else {
        fs.unlinkSync(useSystemMenuFile);
      }
      isQuiting = true;
      mainWindow.close();
      mainWindow = null;
      isQuiting = false;
      createMainWindow();
    }
  };
  mainWindow.webContents.on('before-input-event', onInputEvent);
  mainView.webContents.on('before-input-event', onInputEvent);
  // open dev tool default
  if (process.env.DEBUG == 1) {
    mainView.webContents.openDevTools();
  }
  if (!tray) {
    createTray();
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

function showMainWindow() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  } else {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

if (!singleInstanceLock) {
  console.warn('App already running');
	app.quit();
} else {
  app.whenReady().then(() => {
    createMainWindow();
    process.argv.forEach((cmd) => {
      handleCustomizedSchemeUri(cmd);
    });
  });
  app.on('second-instance', (e, commandLine, cwd) => {
    if (!mainWindow) {
      return;
    }
    showMainWindow();
    commandLine.forEach(cmd => {
      handleCustomizedSchemeUri(cmd);
    });
  });
  
  app.on('before-quit', () => {
    isQuiting = true;
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
    showMainWindow();
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
}
