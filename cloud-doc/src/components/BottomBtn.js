import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => (
  <button
    type="button"
    className={`btn btn-block no-border ${colorClass}`}
    onClick={onBtnClick}
  >
    <FontAwesomeIcon size="lg" icon={icon} className="mr-2"></FontAwesomeIcon>
    {text}
  </button>
)

BottomBtn.propTypes = {
  text: PropTypes.string,
  colorClass: PropTypes.string,
  icon: PropTypes.object.isRequired,
  onBtnClick: PropTypes.func
}
BottomBtn.defaultProps = {
  text: '新建'
}
export default BottomBtn
