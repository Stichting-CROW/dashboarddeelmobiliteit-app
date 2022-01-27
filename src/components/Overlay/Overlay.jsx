import './Overlay.css'
// import { useSelector } from 'react-redux';

export default function Misc(props) {
  return (
    <div className={`Overlay relative z-20 w-full h-full lg:w-2/3 bg-white pb-16`}>
      <div className="Overlay-inner overflow-y-auto h-full">
        {props.children}
      </div>
    </div>
  );
}
