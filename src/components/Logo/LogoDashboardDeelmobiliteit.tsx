import pnhLogo from '../../images/pnh_logo.svg';

function LogoDashboardDeelmobiliteit() {
  return (
    <div className="">
      <div style={{
        font: 'normal normal bold 20px/24px Inter',
        color: '#343E47'
      }}>
        Dashboard Deelmobiliteit
      </div>
      <div style={{
        width: '155px',
        marginTop: '4px',
        borderBottom: '3px solid #15AEEF'
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '6px'
      }}>
        <img
          src={pnhLogo}
          alt="Logo Provincie Noord-Holland"
          style={{ height: '24px', width: 'auto' }}
        />
        <span style={{
          font: 'normal normal 600 11px/14px Inter',
          color: '#00325F'
        }}>
          editie
        </span>
      </div>
    </div>
  )
}

export default LogoDashboardDeelmobiliteit;
