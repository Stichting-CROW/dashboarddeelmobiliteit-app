const ActionModule = ({
    children
}) => {
    return <div data-name="ActionModule" className="
        fixed
        bg-white
        rounded
        p-4
        right-0
    " style={{
        top: '8px',
        zIndex: 100,
        background: '#FFFFFF 0% 0% no-repeat padding-box',
        boxShadow: '-2px 1px 3px #00000029',
        width: '300px'
    }}>
        {children}
    </div>
}

export default ActionModule;
