const {app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev') // 环境变量
let mainWindow

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 680,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.webContents.openDevTools() // 打开开发者工具

  const urlLocation = isDev ? 'http://localhost:3000/' : 'dummyurl'
  mainWindow.loadURL(urlLocation)
})