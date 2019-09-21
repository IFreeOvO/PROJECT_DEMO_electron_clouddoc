import { useState, useEffect } from 'react'

import axios from 'axios'

const useURLLoader = (url) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    setLoading(true)
    axios.get(url).then(res => {
      console.log(res)
      setData(res.data)
      setLoading(false)
    })
  }, [url]) // 加上[]就不会重复执行,代表不依懒任何状态, [fetch] 依懒fetch发生变化

  return [data, loading]
}

export default useURLLoader