import React, { useState, useEffect } from 'react'
import axios from 'axios'

const DogShow = () => {
  const [url, setUrl] = useState('')

  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)

  const style = {
    width: 200
  }

  useEffect(() => {
    setLoading(true)
    axios.get('https://dog.ceo/api/breeds/image/random').then(res => {
      console.log(res)
      setUrl(res.data.message)
      setLoading(false)
    })
  }, [fetch]) // 加上[]就不会重复执行,代表不依懒任何状态, [fetch] 依懒fetch发生变化

  return (
    <>
      {loading ? <p>读取中</p> : <img src={url} alt="dog" style={style} />}
      <button
        onClick={() => {
          setFetch(!fetch)
        }}
      >
        再看一张图片
      </button>
    </>
  )
}

export default DogShow
