const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');
let gameWindow;
ipcMain.handle('game:configureWindow', (event, settings) => {
  if (!gameWindow || event.sender !== gameWindow.webContents || !settings || typeof settings !== 'object') return false;
  const sizes = { '1280x800': [1280,800], '1024x768': [1024,768], '1600x900': [1600,900] };
  if (!Object.hasOwn(sizes, settings.size) || typeof settings.fullscreen !== 'boolean') return false;
  gameWindow.setFullScreen(settings.fullscreen);
  if (!settings.fullscreen) { const [width,height]=sizes[settings.size]; gameWindow.setSize(width,height); gameWindow.center(); }
  return true;
});
app.whenReady().then(() => {
  gameWindow = new BrowserWindow({ width:1280,height:800,minWidth:800,minHeight:600,title:'생활형 온라인 RPG',webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false,preload:path.join(__dirname,'preload.cjs')} });
  gameWindow.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
  if(process.env.VITE_DEV_SERVER_URL)gameWindow.loadURL(process.env.VITE_DEV_SERVER_URL);else gameWindow.loadFile(path.join(__dirname,'../dist/client/index.html'));
});
app.on('window-all-closed',()=>app.quit());
