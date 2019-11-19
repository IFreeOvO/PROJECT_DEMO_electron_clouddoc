const { app, Menu, ipcMain, dialog } = require('electron')
const uuidv4 = require('uuid/v4')
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
    const { key, path, id } = data
    manager.getState(data.key).then(
      resp => {
        console.log('文件存在', resp)
        console.log(filesObj[data.id])
        // 七牛云时间戳是精确到纳秒的
        const serverUpdatedTime = Math.round(resp.putTime / 10000)
        const localUpdatedTime = filesObj[id].updatedAt
        if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
          manager.downloadFile(key, path).then(() => {
            console.log('更新本地文件')
            mainWindow.webContents.send('file-downloaded', {
              status: 'download-sucess',
              id
            })
          })
        } else {
          console.log('no-new-file')
          mainWindow.webContents.send('file-downloaded', {
            status: 'no-new-file',
            id
          })
        }
      },
      error => {
        console.log(error)
        if (error.statusCode === 612) {
          mainWindow.webContents.send('file-downloaded', {
            status: 'no-file',
            id
          })
        }
      }
    )
  })

  // 监听全部上传到云端
  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true)
    const manager = createManager()
    const filesObj = fileStore.get('file') || {}
    const uploadPromiseArr = Object.keys(filesObj).map(key => {
      const file = filesObj[key]
      return manager.uploadFile(`${file.title}.md`, file.path)
    })

    Promise.all(uploadPromiseArr)
      .then(res => {
        console.log('全部上传完毕', res)
        dialog.showMessageBox({
          type: 'info',
          title: `成功上传了${res.length}个文件！`,
          message: `成功上传了${res.length}个文件！`
        })
        mainWindow.webContents.send('files-uploaded')
      })
      .catch(() => {
        dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
      })
      .finally(() => {
        mainWindow.webContents.send('loading-status', false)
      })
  })

  // 监听全部下载到本地
  ipcMain.on('download-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true)

    // 获取本地文件名
    const filesObj = fileStore.get('file') || {}
    const localFiles = Object.keys(filesObj).reduce((files, fileKey) => {
      const title = filesObj[fileKey].title + '.md'
      files[title] = filesObj[fileKey]
      return files
    }, {})
    console.log('本地文件', localFiles)

    const manager = createManager()

    const savedLocation =
      settingsStore.get('savedFileLocation') || app.getPath('documents')
    let downloadFiles = []
    // 获取云端文件列表
    manager
      .getFilesList()
      .then(({ items }) => {
        // console.log('返回', items)
        // 和本地列表进行对比，下载文件应该是比本地新的或本地没有的
        downloadFiles = items.filter(item => {
          if (localFiles[item.key]) {
            console.log('本地存在', item.key)
            return item.putTime / 10000 > localFiles[item.key].updatedAt
          } else {
            console.log('本地不存在', item.key)
            return true
          }
        })
        console.log('需要下载的文件列表', downloadFiles)

        const downloadPromiseArr = downloadFiles.map(item => {
          // 本地存在的按原路径下载，不存在的按设置路径下载
          if (localFiles[item.key]) {
            return manager.downloadFile(item.key, localFiles[item.key].path)
          } else {
            return manager.downloadFile(
              item.key,
              path.join(savedLocation, item.key)
            )
          }
        })

        return Promise.all(downloadPromiseArr)
      })
      .then(arr => {
        dialog.showMessageBox({
          type: 'info',
          title: `本地下载更新完毕！`,
          message: `本地下载更新完毕！`
        })

        // // 生成一个新的key为id, value为文件详情的object
        // 本地存在的对象覆盖掉，不存在的新建一个文件对象
        const finalFilesObj = downloadFiles.reduce(
          (newFilesObj, qiniuFile) => {
            const currentFile = localFiles[qiniuFile.key]
            if (currentFile) {
              const updateItem = {
                ...currentFile,
                isSynced: true,
                updatedAt: new Date().getTime()
              }
              return {
                ...newFilesObj,
                [currentFile.id]: updateItem
              }
            } else {
              const newId = uuidv4()
              const title = qiniuFile.key.split('.')[0]
              const newItem = {
                id: newId,
                title,
                body: '## 请输出 Markdown',
                createdAt: new Date().getTime(),
                path: path.join(savedLocation, `${title}.md`),
                isSynced: true,
                updatedAt: new Date().getTime()
              }
              return {
                ...newFilesObj,
                [newId]: newItem
              }
            }
          },
          { ...filesObj }
        )
        console.log('更新本地数据', finalFilesObj)
        mainWindow.webContents.send('files-downLoaded', {
          newFiles: finalFilesObj
        })
      })
      .catch(() => {
        dialog.showErrorBox('下载失败', '下载失败')
      })
      .finally(() => {
        mainWindow.webContents.send('loading-status', false)
      })
  })

  // 监听文件删除
  ipcMain.on('delete-file', (event, data) => {
    const manager = createManager()
    manager
      .getState(data.key)
      .then(res => {
        console.log('找到要删除的云端文件')
        manager.deleteFile(data.key).then(() => {
          dialog.showMessageBox({
            type: 'info',
            title: `删除成功！`,
            message: `删除成功！`
          })
        })
      })
      .catch(err => {
        console.log('删除的文件不在云端', err)
      })
  })

  // 监听文件重命名
  ipcMain.on('move-file', (event, data) => {
    const manager = createManager()
    const { srcKey, destKey, path } = data
    // console.log('收到数据', srcKey, destKey);
    manager
      .getState(srcKey)
      .then(res => {
        // console.log('找到要重命名的云端文件');
        manager.moveFile(srcKey, destKey).then(() => {
          console.log('重命名成功')
        })
      })
      .catch(err => {
        console.log('重命名的文件不在云端', err)
        // manager
        //   .uploadFile(destKey, path)
        //   .then(data => {
        //     console.log('上传成功', data)
        //     mainWindow.webContents.send('active-file-uploaded')
        //   })
        //   .catch(() => {
        //     dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
        //   })
      })
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
