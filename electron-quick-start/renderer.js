// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require('electron')
const { BrowserWindow } = require('electron').remote // 可以理解为remote就是主进程

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('node-version').innerHTML = process.versions.node
  document.getElementById('send').addEventListener('click', () => {
    // 参数: 事件名, 信息
    ipcRenderer.send('message', 'hello from renderer')

    // 打开新窗口
    let win = new BrowserWindow({
      width: 800,
      height: 600
    })
    win.loadURL('http://47.105.150.105:8010/#/recommend')
  })

  ipcRenderer.on('reply', (event, arg) => {
    document.getElementById('message').innerHTML = arg
  })
})
