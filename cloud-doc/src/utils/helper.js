export const flattenArr = (arr) => {
  // reduce的回调函数第一个参数是之前的结果, 第二个参数是当前值
  return arr.reduce((map, item) => {
    map[item.id] = item 
    return map
  }, {})
}

export const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key])
}

export const getParentNode = (node, parentClassName) => {
  let current = node
  while(current !== null) {
    if(current.classList.contains(parentClassName)) {
      return current
    }
    current = current.parentNode
  }
  return false
}

export const timestampToString = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}