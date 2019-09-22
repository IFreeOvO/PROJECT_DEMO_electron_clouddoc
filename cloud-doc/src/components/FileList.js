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

  const endEdit = () => {
    setEditStatus(false)
    setValue('')
  }

  useEffect(() => {
    if (enterPressed && editStatus) {
      const editItem = files.find(file => file.id === editStatus)
      onSaveEdit(editItem.id, value)
      endEdit()
    }

    if (escPressed && editStatus) {
      endEdit()
    }
  })

  useEffect(
    () => {
      console.log('编辑状态', editStatus)
      // 输入框自动聚焦
      if (editStatus) {
        node.current.focus()
      }
    },
    [editStatus]
  )

  return (
    <ul className="list-group list-group-flush file-list">
      {files.map(file => (
        <li
          className="list-group-item bg-light row d-flex align-items-center file-item mx-0"
          key={file.id}
        >
          {file.id !== editStatus && (
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

          {file.id === editStatus && (
            <>
              <input
                ref={node}
                type="text"
                className="form-control col-10"
                value={value}
                onChange={e => {
                  setValue(e.target.value)
                }}
              />
              <button
                type="button"
                className="icon-button col-2"
                onClick={endEdit}
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
