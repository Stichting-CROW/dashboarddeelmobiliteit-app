import logo from './logo.svg';
import './Demo.css';

function Demo() {
  return (
    <div className="Demo">
      <header className="Demo-header">
        <img src={logo} className="Demo-logo" alt="logo" />
        <p>
          Edit <code>src/Demo.js</code> and save to reload.
        </p>
        <a
          className="Demo-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Demo;
