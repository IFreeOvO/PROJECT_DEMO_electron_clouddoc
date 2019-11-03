const {app, BrowserWindow, Menu } = require('electron')
const isDev = require('electron-is-dev') // 环境变量
const menuTemplate = require('./src/menuTemplate')
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

  // 设置原生菜单
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
})