import { useSelector } from 'react-redux';

import './LoadingIndicator.css';

const LoadingIndicator = () => {
  
  const show = useSelector(state => state.ui.showloading)
  
  if(show) {
    return (
        <img className="loadingindicator" alt="spinning progress indicator" src="/images/components/LoadingIndicator/bike_wheel-512.png"/>
    )
  } else {
    return null;
  }
}

export default LoadingIndicator;