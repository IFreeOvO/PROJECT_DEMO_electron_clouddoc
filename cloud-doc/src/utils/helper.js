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