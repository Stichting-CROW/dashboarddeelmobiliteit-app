import {
 BrowserRouter as Router,
 Switch,
 Route,
 Link
} from "react-router-dom";

import Map from './pages/Map.jsx';
import Demo from './pages/Demo.jsx';

import './App.css';

function App() {
  return (
    <Router>
       <div>
         <nav>
           <ul>
             <li>
               <Link to="/">Home</Link>
             </li>
             <li>
               <Link to="/map">Map</Link>
             </li>
           </ul>
         </nav>

         <Switch>
           <Route path="/demo">
            <Demo />
           </Route>
           <Route path="/map">
            <Map />
           </Route>
           <Route path="/">
            <Demo />
           </Route>
         </Switch>
       </div>
     </Router>
  );
}

export default App;
