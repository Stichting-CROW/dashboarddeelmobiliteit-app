import './Topbar.css';
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../../actions/authentication';

function Topbar() {
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  const logOut = () => {
    if (isLoggedIn) {
      dispatch( clearUser() );
    }
  }

  return (
    <div className="topbar flex justify-between">
      <div className="topbar-logo" />
      {isLoggedIn
        ? <Link className="text-right" onClick={logOut} to="/">
            Log uit
          </Link>
        : <Link className="text-right" to="/login">
            Log in
          </Link>
      }
    </div>
  )
}

        


export default Topbar;
