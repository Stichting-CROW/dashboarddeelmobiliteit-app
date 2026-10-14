import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StateType } from '../types/StateType';

function useUiVisibility(name: string): [boolean, (visible: boolean) => void] {
  const dispatch = useDispatch();

  const isVisible = useSelector((state: StateType) =>
    Boolean(state.ui?.[name])
  );

  const setVisible = useCallback((visible: boolean) => {
    dispatch({
      type: 'SET_VISIBILITY',
      payload: { name, visibility: visible },
    });
  }, [dispatch, name]);

  return [isVisible, setVisible];
}

export default useUiVisibility;
