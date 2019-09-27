import React, { useState } from 'react'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import { flattenArr, objToArr } from './utils/helper'

import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'

import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import defaultFiles from './utils/defaultFiles'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
const fs = window.require('fs') // renderer process赋予的nodejs能力

function App() {
  const [files, setFiles] = useState(flattenArr(defaultFiles))
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  const [searchFiles, setSearchFiles] = useState([])
  const filesArr = objToArr(files)

  const activeFile = files[activeFileID]
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const fileListArr = searchFiles.length ? searchFiles : filesArr

  // 打开md文件
  const fileClick = fileID => {
    // 设置打开文件的id
    setActiveFileID(fileID)

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
    // 更新md内容
    // const newFiles = files.map(file => {
    //   if(file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })
    // setFiles(newFiles)
    const newFile = { ...files[id], body: value }
    setFiles({ ...files, [id]: newFile })

    // 更新unsavedIDs
    if (!unsavedFileIDs.includes(id)) {
      setUnsavedFileIDs([...unsavedFileIDs, id])
    }
  }

  // 删除文件
  const deleteFile = id => {
    // const newFiles = files.filter(file => file.id !== id)
    // setFiles(newFiles)
    delete files[id]
    setFiles(files)

    // 关闭相应的以打开的tab
    tabClose(id)
  }

  // 编辑文件名
  const updateFileName = (id, title) => {
    // const newFiles = files.map(file => {
    //   if(file.id === id) {
    //     file.title = title
    //     file.isNew = false
    //   }
    //   return file
    // })
    // setFiles(newFiles)
    const modifiedFile = { ...files[id], title, isNew: false }
    setFiles({ ...files, [id]: modifiedFile })
  }

  // 搜索文件
  const fileSearch = keyword => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchFiles(newFiles)
  }

  // 新建文件
  const createNewFile = () => {
    // const newID = uuidv4()
    // const newFiles = [
    //   ...files,
    //   {
    //     id: newID,
    //     title: '',
    //     body: '## 请输出 Markdown',
    //     createdAt: new Date().getTime(),
    //     isNew: true
    //   }
    // ]
    // setFiles(newFiles)

    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输出 Markdown',
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({...files, [newID]: newFile})
  }

  return (
    <div className="App container-fluid px-0">
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
