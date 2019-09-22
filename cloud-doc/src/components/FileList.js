import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false)
  const [value, setValue] = useState('')
  const enterPressed = useKeyPress(13) // 是否按了回车
  const escPressed = useKeyPress(27) // 是否按了esc
  let node = useRef(null)

  const endEdit = (editItem) => {
    setEditStatus(false)
    setValue('')

    // 对于新建的文件,结束编辑状态时要改变isNew属性
    if(editItem && editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }

  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value)
      endEdit()
    }

    if (escPressed && editStatus) {
      endEdit(editItem)
    }
  })

  useEffect(
    () => {
      console.log('编辑状态', editStatus)
      // 输入框自动聚焦
      if (editStatus) {
        node.current && node.current.focus()
      }
    },
    [editStatus]
  )

  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    console.log(newFile)
    if(newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.title)
    }
  }, [files])

  return (
    <ul className="list-group list-group-flush file-list">
      {files.map(file => (
        <li
          className="list-group-item bg-light row d-flex align-items-center file-item mx-0"
          key={file.id}
        >
          {(file.id !== editStatus && !file.isNew) && (
            <>
              <span className="col-2">
                <FontAwesomeIcon size="lg" icon={faMarkdown}></FontAwesomeIcon>
              </span>
              <span
                className="col-6 c-link"
                onClick={() => {
                  onFileClick(file.id)
                }}
              >
                {file.title}
              </span>

              <button
                type="button"
                className="icon-button col-2"
                onClick={() => {
                  console.log('点击', file.id)
                  setEditStatus(file.id)
                  console.log('点击 ---', editStatus)
                  setValue(file.title)
                }}
              >
                <FontAwesomeIcon
                  size="lg"
                  icon={faEdit}
                  title="编辑"
                ></FontAwesomeIcon>
              </button>

              <button
                type="button"
                className="icon-button col-2"
                onClick={() => {
                  onFileDelete(file.id)
                }}
              >
                <FontAwesomeIcon
                  size="lg"
                  icon={faTrash}
                  title="删除"
                ></FontAwesomeIcon>
              </button>
            </>
          )}

          {(file.id === editStatus || file.isNew) && (
            <>
              <input
                ref={node}
                type="text"
                className="form-control col-10"
                value={value}
                placeholder="请输入文件名称"
                onChange={e => {
                  setValue(e.target.value)
                }}
              />
              <button
                type="button"
                className="icon-button col-2"
                onClick={()=> {endEdit(file)}}
              >
                <FontAwesomeIcon
                  size="lg"
                  icon={faTimes}
                  title="关闭"
                ></FontAwesomeIcon>
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}

export default FileList
