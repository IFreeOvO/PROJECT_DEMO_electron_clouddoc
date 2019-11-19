const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
  constructor(accessKey, secretKey, bucket) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    this.bucket = bucket

    // 构建配置类
    this.config = new qiniu.conf.Config()
    // 空间对应的机房
    this.config.zone = qiniu.zone.Zone_z0

    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
  }

  // 文件移动或重命名
  moveFile(srcKey, destKey) {
    return new Promise((resolve, reject) => {
      // 强制覆盖已有同名文件
      const options = {
        force: true
      }
      this.bucketManager.move(
        this.bucket,
        srcKey,
        this.bucket,
        destKey,
        options,
        this._handleCallback(resolve, reject)
      )
    })
  }

  // 获取指定前缀的文件列表
  getFilesList() {
    return new Promise((resolve, reject) => {
      const options = {}
      this.bucketManager.listPrefix(
        this.bucket,
        options,
        this._handleCallback(resolve, reject)
      )
    })
  }

  uploadFile(key, localFilePath) {
    // 上传凭证
    const options = {
      scope: `${this.bucket}:${key}` // 加上:${key} 实现覆盖上传
    }
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(this.mac)
    const formUploader = new qiniu.form_up.FormUploader(this.config)
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise((resolve, reject) => {
      formUploader.putFile(
        uploadToken,
        key,
        localFilePath,
        putExtra,
        this._handleCallback(resolve, reject)
      )
    })
  }

  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(
        this.bucket,
        key,
        this._handleCallback(resolve, reject)
      )
    })
  }

  // 获取bucket空间域名
  getBucketDomain() {
    const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
    const digest = qiniu.util.generateAccessToken(this.mac, reqURL)

    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithoutForm(
        reqURL,
        digest,
        this._handleCallback(resolve, reject)
      )
    })
  }

  // 获取文件信息
  getState(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(
        this.bucket,
        key,
        this._handleCallback(resolve, reject)
      )
    })
  }

  // 获取下载文件的链接
  generateDownloadLink(key) {
    const domainPromise = this.publicBucketDomain
      ? Promise.resolve([this.publicBucketDomain])
      : this.getBucketDomain()

    return domainPromise.then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // 判断含不含https
        const pattern = /^https?/
        this.publicBucketDomain = pattern.test(data[0])
          ? data[0]
          : `http://${data[0]}`

        return this.bucketManager.publicDownloadUrl(
          this.publicBucketDomain,
          key
        )
      } else {
        console.log('不存在')
        throw Error('域名未找到,请查看储存空间是否过期')
      }
    })
  }

  downloadFile(key, downloadPath) {
    // 获取下载链接
    return this.generateDownloadLink(key)
      .then(link => {
        const timeStamp = new Date().getTime()
        const url = `${link}?timestamp=${timeStamp}`

        return axios({
          url,
          method: 'GET',
          responseType: 'stream',
          headers: { 'Cache-Control': 'no-cache' }
        })
      })
      .then(response => {
        // 创建写入流
        const writer = fs.createWriteStream(downloadPath)

        response.data.pipe(writer)
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })
      })
      .catch(err => {
        return Promise.reject({ err: err.response })
      })
  }

  _handleCallback(resolve, reject) {
    return (respErr, respBody, respInfo) => {
      if (respErr) {
        throw respErr
      }
      if (respInfo.statusCode === 200) {
        resolve(respBody)
      } else {
        reject({
          statusCode: respInfo.statusCode,
          body: respBody
        })
      }
    }
  }
}

module.exports = QiniuManager
