import './ContentPage.css'
import { useSelector } from 'react-redux';

import {StateType} from '../types/StateType';

export default function ContentPage(props) {
  const isFilterBarVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui.FILTERBAR : false;
  });

  return (
    <div
      className={`ContentPage relative bg-white h-full pb-20 ${isFilterBarVisible && ! props.forceFullWidth ? '' : 'full-page'}`}
      style={{
        overflowY: 'auto',
        zIndex: 1,
      }}
    >
      <div className="ContentPage-inner py-3 sm:py-8 pl-3 pr-3 sm:pl-12 sm:pr-12 pb-20">
        {props.children}
      </div>
    </div>
  );
}
