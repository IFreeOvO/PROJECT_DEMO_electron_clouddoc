import React, { useState, useEffect } from 'react'
import useMousePosition from '../hooks/useMousePosition'

const LikeButton = () => {
  const position = useMousePosition()

  const [ like, setLike ] = useState(0) // 设置初始值0, like当前state, setLike更新state
  const [on, setOn] = useState(true)
  
  const [obj, setObj] = useState({ like: 0, on: true }) // 推荐把对象拆成两个变量进行控制
  
  // 第一次渲染和每次更新渲染都会执行
  useEffect(() => {
    document.title = `点击了${like}次`
  })
  return (
    <>
    <p>{position.y}</p>
      <button
        onClick={() => {
          // console.log(obj.like, obj.like + 1)
          setObj({ ...obj , like: obj.like + 1 }) // set会设置新的对象,所以即使另一个属性不变也要加上去
        }}
      >
        {obj.like}赞
      </button>
      <button onClick={()=> {setObj({...obj , on: !obj.on})}}>{obj.on? 'on': 'off'}</button>

      <button
        onClick={() => {
          setLike(like + 1 ) 
        }}
      >
        {like}赞
      </button>
      <button onClick={()=> {setOn(!on)}}>{on? 'on': 'off'}</button>
    </>
  )
}

export default LikeButton
