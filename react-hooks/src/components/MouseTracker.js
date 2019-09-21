import React, { useState, useEffect } from 'react'

const MouseTracker = () => {
  const [position, setPosition] = useState({x: 0, y: 0})
  useEffect(() => {
    const updateMouse = (e) => {
      console.log('inner')
      setPosition({x: e.clientX, y: e.clientY})
    }
    console.log('add listener')
    document.addEventListener('mousemove', updateMouse)

    // 返回结束时的回调, 如果不做这个清除动作,绑定的事件会越来越多
    return () => {
      console.log('remove listener')
      document.removeEventListener('mousemove', updateMouse)
    }
  })

  return (
    <p>
      X：{position.x}, Y：{position.y}
    </p>
  )
}

export default MouseTracker