import React, { useState, useEffect } from 'react'
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import { flattenArr, objToArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'

import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'

import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import useIpcRenderer from './hooks/useIpcRenderer'
import Loader from './components/Loader'

// 导入node模块
const { join, basename, extname, dirname } = window.require('path') // 直接取path的join方法
const { remote, ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({ name: 'Files Data' }) // 存储在~/Library/ApplicationSupport/cloud-doc/Files Data.json里
const settingsStore = new Store({ name: 'Settings' })
const getAutoSync = () =>
  ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(
    key => !!settingsStore.get(key)
  )

// 本地持久化,新建和重命名时需要
const saveFilesToStore = files => {
  // 不必存储所有信息，例如：isNew, body等
  const fileStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})
  fileStore.set('file', fileStoreObj)
  console.log('存储结构', fileStore.get('file'))
}

function App() {
  const [files, setFiles] = useState(fileStore.get('file') || {})
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  const [searchFiles, setSearchFiles] = useState([])
  const [isLoading, setLoading] = useState(false)

  const filesArr = objToArr(files)
  const savedLocation =
    settingsStore.get('savedFileLocation') || remote.app.getPath('documents') // 定义本地存储路径。文稿文件夹下
  const activeFile = files[activeFileID]
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const fileListArr = searchFiles.length ? searchFiles : filesArr

  // 打开md文件
  const fileClick = fileID => {
    // 设置打开文件的id
    setActiveFileID(fileID)

    // 从本地读取文件
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile

    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper
          .readFile(currentFile.path)
          .then(value => {
            const newFile = { ...files[fileID], body: value, isLoaded: true }
            setFiles({ ...files, [fileID]: newFile })
          })
          .catch(e => {
            console.log(e)

            delete files[fileID]
            setFiles(files)
            saveFilesToStore(files)
            // 关闭相应的以打开的tab
            tabClose(fileID)

            remote.dialog.showMessageBoxSync({
              type: 'error',
              message: '该文件不存在'
            })
          })
      }
    }

    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }

  // 点击tab标签
  const tabClick = fileID => {
    setActiveFileID(fileID)
  }

  // 关闭tab标签
  const tabClose = id => {
    // 过滤掉关闭的标签
    const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
    setOpenedFileIDs(tabsWithout)

    // 关闭后激活第一个标签
    if (tabsWithout.length) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }

  // 监听mde内容变化的回调
  const fileChange = (id, value) => {
    if (value === files[id].body) {
      return
    }
    // 更新md内容
    const newFile = { ...files[id], body: value }
    setFiles({ ...files, [id]: newFile })

    // 更新unsavedIDs
    if (!unsavedFileIDs.includes(id)) {
      setUnsavedFileIDs([...unsavedFileIDs, id])
    }
  }

  // 删除文件
  const deleteFile = id => {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)

      return
    }

    fileHelper.deleteFile(files[id].path).then(() => {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
      saveFilesToStore(afterDelete)
      // 关闭相应的以打开的tab
      tabClose(id)
      if (getAutoSync()) {
        ipcRenderer.send('delete-file', { key: `${files[id].title}.md` })
      }
    })
  }

  // 编辑文件名
  const updateFileName = (id, title, isNew) => {
    // 新文件和旧文件路径不一样
    // 旧文件的路径应该是旧路径+旧标题
    const newPath = isNew
      ? join(savedLocation, `${title}.md`)
      : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }

    console.log(files)
    // 判断是否重名

    console.log('首次进入', files[id].title, title)
    const oldName = files[id].title
    const newName = title
    if (files[id].title !== title) {
      console.log('修改过')
      for (let i = 0; i < filesArr.length; i++) {
        const file = filesArr[i]

        if (file.title === title) {
          console.log('重名')
          return
        }
      }
    }
    let path
    if (isNew) {
      path = newPath
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      path = oldPath
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }

    if (getAutoSync()) {
      ipcRenderer.send('move-file', {
        srcKey: `${oldName}.md`,
        destKey: `${newName}.md`,
        path
      })
    }
  }

  // 搜索文件
  const fileSearch = keyword => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchFiles(newFiles)
  }

  // 新建文件
  const createNewFile = () => {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输出 Markdown',
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [newID]: newFile })
  }

  // 保存文件
  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
      remote.dialog.showMessageBox({
        type: 'info',
        title: `保存成功！`,
        message: `保存成功！`
      })
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })
      }
    })
  }

  // 导入文件
  const importFiles = () => {
    remote.dialog.showOpenDialog(
      {
        title: '选择导入的 Markdown 文件',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Markdown files', extensions: ['md'] }]
      },
      paths => {
        console.log(paths)
        if (Array.isArray(paths)) {
          // 过滤掉已经添加的文件
          const filteredPaths = paths.filter(path => {
            const alreadyAdded = Object.values(files).find(file => {
              return file.path === path
            })
            return !alreadyAdded
          })

          // 将路径数组进行扩展
          // [{id: '', path: '', title: ''}, ..., {}]
          const importFilesArr = filteredPaths.map(path => {
            return {
              id: uuidv4(),
              title: basename(path, extname(path)),
              path
            }
          })
          // console.log(importFilesArr);

          // 对文件数组进行展开
          const newFiles = { ...files, ...flattenArr(importFilesArr) }
          // console.log(newFiles);
          setFiles(newFiles)
          saveFilesToStore(newFiles)
          if (importFilesArr.length > 0) {
            remote.dialog.showMessageBox({
              type: 'info',
              title: `成功导入了${importFilesArr.length}个文件！`,
              message: `成功导入了${importFilesArr.length}个文件！`
            })
          }
        }
      }
    )
  }

  // 文件上传
  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = {
      ...files[id],
      isSynced: true,
      updatedAt: new Date().getTime()
    }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 文件下载
  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-sucess') {
        newFile = {
          ...files[id],
          body: value,
          isLoaded: true,
          isSynced: true,
          updatedAt: new Date().getTime()
        }
      } else {
        console.log('没有新文件')
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }

  // 上传所有文件
  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 下载所有文件到本地
  const filesDownLoaded = (event, {newFiles}) => {
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 监听原生菜单事件
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'files-uploaded': filesUploaded,
    'files-downLoaded': filesDownLoaded,
    'loading-status': (message, status) => {
      setLoading(status)
    }
  })

  return (
    <div className="App container-fluid px-0">
      {isLoading && <Loader />}
      <div className="row row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch title="我的云文档" onFileSearch={fileSearch}></FileSearch>
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          ></FileList>
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              ></BottomBtn>
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              ></BottomBtn>
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {!activeFile && (
            <div className="start-page">选择或创建新的MarkDown文档</div>
          )}
          {activeFile && (
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              ></TabList>
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={value => {
                  fileChange(activeFile.id, value)
                }}
                options={{
                  minHeight: '515px'
                }}
              ></SimpleMDE>
              {activeFile.isSynced && (
                <span className="sync-status">
                  已同步，上次同步时间{timestampToString(activeFile.updatedAt)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
