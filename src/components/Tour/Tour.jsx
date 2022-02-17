import React, {useState, useEffect, useRef} from 'react'
import {marked} from 'marked'
import { Redirect } from "react-router-dom";
import { Slide, Fade } from 'react-slideshow-image';

import Logo from '../Logo.jsx';
import { IconButtonClose } from '../IconButtons.jsx';

import './react-slideshow-image.css';

const slideImages = [...Array(13).keys()].slice(1).map(x => {
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
    // console.log(`slide transition from ${oldIndex} to ${newIndex}`);
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
                  {idx === 10 && <span className="each-slide-text">
                    <a href="https://docs.crow.nl/deelfietsdashboard/hr-dataspec/" target="_blank" rel="external">
                      Klik hier voor de specs
                    </a>
                  </span>}
                  {idx === 11 && <span className="each-slide-text">
                    <div><a href="https://www.fietsberaad.nl/Kennisbank/Afspraken-over-data-en-financiering-van-dashboard" target="_blank" rel="external">
                      Openbaarheid en financiering
                    </a></div>
                    <div><a href="https://github.com/Stichting-CROW/" target="_blank" rel="external">
                      GitHub
                    </a></div>
                    <div><a href="https://gitlab.com/bikedashboard" target="_blank" rel="external">
                      GitLab
                    </a></div>
                    <div><a href="https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues" target="_blank" rel="external">
                      Bugs & Suggesties
                    </a></div>
                    <div><a href="mailto:info@deelfietsdashboard.nl" target="_blank" rel="external">
                      info@deelfietsdashboard.nl
                    </a></div>
                  </span>}
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