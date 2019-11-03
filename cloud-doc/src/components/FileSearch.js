import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useIpcRenderer from '../hooks/useIpcRenderer'

const FileSearch = ({ title, onFileSearch }) => {
  const [inputActive, setInputActive] = useState(false)
  const [value, setValue] = useState('')
  const enterPressed = useKeyPress(13) // 是否按了回车
  const escPressed = useKeyPress(27) // 是否按了esc

  let node = useRef(null) // useRef会返回一个对象

  const closeSearch = () => {
    setInputActive(false)
    setValue('')
    onFileSearch('') // 重置搜索结果
  }

  useEffect(() => {
    if(enterPressed && inputActive) {
      onFileSearch(value)
    }

    if(escPressed && inputActive) {
      closeSearch()
    }
    // const handleInputEvent = e => {
    //   const { keyCode } = e
    //   // 按回车
    //   if (keyCode === 13 && inputActive) {
    //     onFileSearch(value)
    //   } else if (keyCode === 27 && inputActive) {
    //     // 按esc
    //     closeSearch(e)
    //   }
    // }

    // document.addEventListener('keyup', handleInputEvent)

    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent)
    // }
  })

  const startSearch = () => {
    setInputActive(true)
  }

  // 监听原生菜单事件
  useIpcRenderer({
    'search-file': startSearch,
  })

  useEffect(() => {
    // 输入框自动聚焦
    if (inputActive) {
      node.current.focus()
    }
  }, [inputActive])

  return (
    <div className="alert alert-primary d-flex justify-content-between align-items-center File-Search mb-0">
      {!inputActive && (
        <>
          <span>{title}</span>
          <button
            type="button"
            className="icon-button"
            onClick={startSearch}
          >
            <FontAwesomeIcon
              size="lg"
              icon={faSearch}
              title="搜索"
            ></FontAwesomeIcon>
          </button>
        </>
      )}
      {inputActive && (
        <>
          <input
            ref={node}
            type="text"
            className="form-control "
            value={value}
            onChange={e => {
              setValue(e.target.value)
            }}
          />
          <button
            type="button"
            className="icon-button "
            onClick={closeSearch}
          >
            <FontAwesomeIcon
              size="lg"
              icon={faTimes}
              title="关闭"
            ></FontAwesomeIcon>
          </button>
        </>
      )}
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}

FileSearch.defaultProps = {
  title: '我的云文档'
}
export default FileSearch
