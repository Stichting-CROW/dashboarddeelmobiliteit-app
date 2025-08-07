// import {themes} from '../../themes';

import {useEffect, useState, useRef} from 'react';

import './InfoTooltip.css';

function InfoTooltip({
  className,
  children
}) {

  const buttonRef = useRef(null);

  const [counter, setCounter] = useState(0)

  useEffect(() => {

    let mouseMoved = false;
    // let button = document.querySelector('.infoButton');
    let button = buttonRef.current;

    const toggleHandler = event => {    
      const classes = button.classList;
      // console.log('toggleHandler', button.classList)
      if (classes.contains('infoButton_isActive')) {
          classes.remove('infoButton_isActive');
      } else {
          classes.add('infoButton_isActive');
      }
      setCounter(counter+1);
    }

    // button.onmousemove = toggleHandler;
    button.addEventListener('click', toggleHandler);

    return () => {
      button.removeEventListener('click', toggleHandler);
    }

  }, [])

  return (
    <button className={`infoButton ${className}`} ref={buttonRef}>
      <div className="infoButton-btn">
        <span className="infoButton-btn-text">i</span>
      </div>
      <div className="infoButton-container">
        <div className="infoButton-container-message">
          {children}
        </div>
      </div>
    </button>
  )
}

export default InfoTooltip;
