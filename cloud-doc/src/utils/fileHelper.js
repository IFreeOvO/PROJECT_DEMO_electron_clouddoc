const fs = window.require('fs').promises // renderer process赋予的nodejs能力

const fileHelper = {
  readFile: (path) => {
    return fs.readFile(path, {encoding: 'utf8'})
  },

  writeFile: (path, content) => {
    return fs.writeFile(path, content, {encoding: 'utf8'})
  },

  renameFile: (path, newPath) => {
    return fs.rename(path, newPath)
  },
  deleteFile: (path) => {
    return fs.unlink(path)
  }
}

export default fileHelper

// const testPath = path.join(__dirname, 'helper.js')
// const testWritePath = path.join(__dirname, 'hello.md')
// const renamePath = path.join(__dirname, 'rename.md')
// fileHelper.readFile(testPath).then((data) => {
//   console.log(data)
// })

// fileHelper.writeFile(testWritePath, '## 你好').then(() => {
//   console.log('写入完毕')
// })

// fileHelper.renameFile(testWritePath, renamePath).then(() => {
//   console.log('重命名成功')
// })

// fileHelper.deleteFile(renamePath).then(() => {
//   console.log('删除成功')
// })