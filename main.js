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
  nativeImage,
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

// Base64 encoded 32x32 tray icon (for snap compatibility)
const TRAY_ICON_BASE64 = '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';

function createTray() {
  // Create icon from base64 for snap compatibility
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
  tray = new Tray(icon);
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
  let appUrl = 'https://apps.ringcentral.com/integration/ringcentral-embeddable/3.x/app.html';
  appUrl = `${appUrl}?appVersion=${version}&userAgent=RingCentralEmbeddableForLinux/${version}&enableRingtoneSettings=1&enableNoiseReductionSetting=1&enableSMSTemplate=1&enableSideWidget=1&enableVoicemailDrop=1`;
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

  ipcMain.on('open-side-drawer', (event, open) => {
    if (!mainWindow) {
      return;
    }
    const currentWidth = mainWindow.getBounds().width;
    const currentHeight = mainWindow.getBounds().height;
    const currentX = mainWindow.getBounds().x;
    const currentY = mainWindow.getBounds().y;
    if (open) {
      if (currentWidth < 600) {
        // set widget + 300, height same
        mainWindow.setBounds({ x: currentX, y: currentY, width: currentWidth + 300, height: currentHeight });
      }
    } else {
      if (currentWidth >= 600) {
        // set widget - 300, height same
        mainWindow.setBounds({ x: currentX, y: currentY, width: currentWidth - 300, height: currentHeight });
      }
    }
  });
}
