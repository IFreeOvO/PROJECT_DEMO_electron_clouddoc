import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false)
  const [value, setValue] = useState('')
  const enterPressed = useKeyPress(13) // 是否按了回车
  const escPressed = useKeyPress(27) // 是否按了esc
  let node = useRef(null)

  const endEdit = editItem => {
    setEditStatus(false)
    setValue('')

    // 对于新建的文件,结束编辑状态时要改变isNew属性
    if (editItem && editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }

  const clickedItem = useContextMenu(
    [
      {
        label: '打开',
        click: () => {
          const parentElement = getParentNode(clickedItem.current, 'file-item')
          if (parentElement) {
            onFileClick(parentElement.dataset.id)
          }
          // console.dir(parentElement)
        }
      },
      {
        label: '重命名',
        click: () => {
          const parentElement = getParentNode(clickedItem.current, 'file-item')
          if (parentElement) {
            setEditStatus(parentElement.dataset.id)
            setValue(parentElement.dataset.title)
          }
          // console.dir(parentElement)
        }
      },
      {
        label: '删除',
        click: () => {
          const parentElement = getParentNode(clickedItem.current, 'file-item')
          if (parentElement) {
            onFileDelete(parentElement.dataset.id)
          }
          // console.dir(parentElement)
        }
      }
    ],
    '.file-list',
    [files]
  )

  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew)
      endEdit()
    }

    if (escPressed && editStatus) {
      endEdit(editItem)
    }
  })

  useEffect(() => {
    // 输入框自动聚焦
    if (editStatus) {
      node.current && node.current.focus()
    }
  }, [editStatus])

  useEffect(() => {
    const newFile = files.find(file => file.isNew)

    if (newFile) {
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
          data-id={file.id}
          data-title={file.title}
        >
          {file.id !== editStatus && !file.isNew && (
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
                  setEditStatus(file.id)
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
                onClick={() => {
                  endEdit(file)
                }}
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
