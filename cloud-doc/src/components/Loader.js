import React from 'react'
import './Loading.scss'

const Loader = ({ text = '处理中' }) => (
  <div className="loading-component text-center">
    <div className="spinner-grow text-primary" role="status">
      <span className="sr-only">{text}</span>
    </div>
    <h5 className="text-primary">{text}</h5>
  </div>
)

export default Loader
