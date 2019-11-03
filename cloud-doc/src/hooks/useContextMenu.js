import { useEffect, useRef } from 'react'
// 加载node模块
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

const useContextMenu = (itemArr, targetSelector, deps) => {
  let clickedElement = useRef(null)

  useEffect(() => {
    const menu = new Menu()
    itemArr.forEach(item => {
      menu.append(new MenuItem(item))
    })

    const handleContextMenu = e => {
      // 只有点击指定元素时才显示菜单
      if (document.querySelector(targetSelector).contains(e.target)) {
        // 存储右键点击对象
        clickedElement.current = e.target
        // 弹出右键菜单。参数传入当前窗口对象
        menu.popup({ window: remote.getCurrentWindow() })
      }
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, deps)

  return clickedElement
}

export default useContextMenu
