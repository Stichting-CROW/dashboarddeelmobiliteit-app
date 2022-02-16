import React, {useState, useEffect, useRef} from 'react'
import {marked} from 'marked'
import { Redirect } from "react-router-dom";
import { Slide, Fade } from 'react-slideshow-image';

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';

import './react-slideshow-image.css';

const slideImages = [...Array(12).keys()].slice(1).map(x => {
  return `/components/Tour/Openbare_presentatie_dashboard_deelmobiliteit_januari_2022-${x < 10 ? '0' : ''}${x}.png`;
})

const sliderProperties = {
  duration: 60000,
  transitionDuration: 300,
  pauseOnHover: true,
  infinite: true,
  arrows: true,
  indicators: true,
  scale: 1.4,
  onChange: (oldIndex, newIndex) => {
    console.log(`slide transition from ${oldIndex} to ${newIndex}`);
  }
}

const Tour = () => {
  const [doRenderRedirect, setDoRenderRedirect] = useState(false);

  let slideRef = useRef(null);

  // Key bindings of left and right arrow
  useEffect(x => {
    const keyDownHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.code === "ArrowLeft") {
        slideRef.current.goBack()
      }
      else if (event.code === "ArrowRight") {
        slideRef.current.goNext()
      }
    }
    window.addEventListener('keydown', keyDownHandler);

    return () => {
      window.removeEventListener('keydown', keyDownHandler);
    }
  }, [])

  const renderRedirect = () => {
    return (
      <Redirect to="/" />
    );
  }
 
  if (doRenderRedirect) {
    return renderRedirect();
  }

  return (
    <div className="
      min-h-screen
      flex justify-center
      px-0
      w-full
    ">
      <IconButtonClose
        onClick={() => setDoRenderRedirect(true)}
        style={{position: 'absolute', right: '30px', top: '18px'}}
      />
      <div className="mx-auto py-8 w-full justify-between flex-col flex">

        <Logo />

        <div className="slide-container flex-1">
          <Fade ref={slideRef} {...sliderProperties}>
            {slideImages.map((x, idx) => {
              return <div key={x} className="each-slide">
                <div style={{'backgroundImage': `url(${slideImages[idx]})`}}>
                  <span></span>
                </div>
              </div>
            })}
          </Fade>
        </div>

      </div>

    </div>
  )

}

export default Tour;