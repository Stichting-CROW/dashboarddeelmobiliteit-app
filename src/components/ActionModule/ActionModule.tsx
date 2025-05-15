import './ActionModule.css';

const ActionModule = ({
  children
}) => {
  return <div data-name="ActionModule" className="
    ActionModule
    fixed
    bg-white
    rounded
    p-4
    right-0
  " style={{
    zIndex: 40,
    background: '#f6f5f4',
    boxShadow: '-2px 1px 3px #00000029',
  }}>
    {children}
  </div>
}

export default ActionModule;
