// import './ContentPage.css'
import { useSelector } from 'react-redux';

export default function Overlay(props) {
  return (
    <div
      className={`Overlay relative z-10 w-full lg:w-2/3 bg-white`}
    >
      <div className="Overlay-inner">
        {props.children}
      </div>
    </div>
  );
}
