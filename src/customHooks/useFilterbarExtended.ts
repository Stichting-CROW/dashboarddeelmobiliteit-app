import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectFilterbarExtended } from '../helpers/filterbarExtendedState';
import {
  FILTERBAR_EXTENDED_CLOSED,
  FilterbarExtendedView,
} from '../types/FilterbarExtendedState';

function useFilterbarExtended() {
  const dispatch = useDispatch();
  const { open, view } = useSelector(selectFilterbarExtended);

  const openView = useCallback((nextView: FilterbarExtendedView) => {
    dispatch({
      type: 'SET_FILTERBAR_EXTENDED',
      payload: { open: true, view: nextView },
    });
  }, [dispatch]);

  const close = useCallback(() => {
    dispatch({
      type: 'SET_FILTERBAR_EXTENDED',
      payload: FILTERBAR_EXTENDED_CLOSED,
    });
  }, [dispatch]);

  const isViewActive = useCallback((checkView: FilterbarExtendedView) => {
    return open && view === checkView;
  }, [open, view]);

  return {
    isOpen: open,
    view,
    openView,
    close,
    isViewActive,
  };
}

export default useFilterbarExtended;
