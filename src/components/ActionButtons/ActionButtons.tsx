import { useSelector } from 'react-redux';
import './ActionButtons.css';
import { StateType } from '../../types/StateType';

export const ActionButtons = ({
    children
}) => {
  
  const filterbarOpen = useSelector((state: StateType) => {
    return state.ui && state.ui.FILTERBAR || false;
  });

  return <div className={`
    ActionButtons
    fixed top-0
    pl-1
    ${filterbarOpen ? 'filter-open' : ''}
  `}>
    {children}
  </div>
}
