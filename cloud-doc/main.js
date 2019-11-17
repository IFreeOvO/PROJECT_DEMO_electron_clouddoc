const { app, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev') // 环境变量
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
const Store = require('electron-store')
const AppWindow = require('./src/AppWindow')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })
let mainWindow, settingsWindow

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucketName = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucketName)
}

app.on('ready', () => {
  const mainWindowConfig = {
    width: 1024,
    height: 680
  }

  const urlLocation = isDev ? 'http://localhost:3000/' : 'dummyurl'
  // mainWindow.loadURL(urlLocation)
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  // 窗口关闭后进行回收
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 设置原生菜单
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-settings-window', (event, data) => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingsFileLocation = `file://${path.join(
      __dirname,
      './settings/settings.html'
    )}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
  })

  // 监听自动保存到七牛云
  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager()
    manager
      .uploadFile(data.key, data.path)
      .then(data => {
        console.log('上传成功', data)
        mainWindow.webContents.send('active-file-uploaded')
      })
      .catch(() => {
        dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
      })
  })

  // 监听文件下载
  ipcMain.on('download-file', (event, data) => {
    const manager = createManager()
    const filesObj = fileStore.get('file')
    const { key, path, id} = data
    manager.getState(data.key).then(
      resp => {
        console.log('文件存在', resp)
        console.log(filesObj[data.id])
        // 七牛云时间戳是精确到纳秒的
        const serverUpdatedTime = Math.round(resp.putTime / 10000)
        const localUpdatedTime = filesObj[id].updatedAt
        if(serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
          manager.downloadFile(key, path).then(() => {
            console.log('更新本地文件');
            mainWindow.webContents.send('file-downloaded', { status: 'download-sucess', id })
          })
        } else {
          console.log('no-new-file');
          mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id })
        }
      },
      error => {
        console.log(error)
        if (error.statusCode === 612) {
          mainWindow.webContents.send('file-downloaded', { status: 'no-file', id })
        }
      }
    )
  })

  ipcMain.on('config-is-saved', () => {
    let qiniuMenu =
      process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = toggle => {
      ;[1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle
      })
    }
    const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(
      key => !!settingsStore.get(key)
    )
    if (qiniuIsConfiged) {
      switchItems(true)
    } else {
      switchItems(false)
    }
  })

  mainWindow.webContents.openDevTools() // 打开开发者工具
})
