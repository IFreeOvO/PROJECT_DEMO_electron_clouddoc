const {app, BrowserWindow, ipcMain} = require('electron')

app.on('ready', () => {
  require('devtron').install()
  let mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      nodeIntegration: true
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools() // 打开开发者工具
  ipcMain.on('message', (event, arg) => {
    console.log(event)
    console.log(arg)
    event.reply('reply', '我是主进程，我收到了')
  })

  // 子窗口
  // let secondWindow = new BrowserWindow({
  //   width: 400,
  //   height: 300,
  //   webPreferences: {
  //     nodeIntegration: true
  //   },
  //   parent: mainWindow // 设置它的父窗口
  // })

  // secondWindow.loadFile('second.html')
})