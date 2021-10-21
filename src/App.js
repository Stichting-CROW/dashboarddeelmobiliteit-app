import {
 BrowserRouter as Router,
 Switch,
 Route
} from "react-router-dom";

import Menu from './components/Menu.jsx';
import Map from './pages/Map.jsx';
import Demo from './pages/Demo.jsx';

import './App.css';

function App() {
  return (
    <Router>
       <div className="App">
        <Menu />

         <Switch>
           <Route path="/demo">
            <Demo />
           </Route>
           <Route path="/">
            <Map />
           </Route>
         </Switch>
       </div>
     </Router>
  );
}

export default App;
