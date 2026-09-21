interface LogoDashboardDeelmobiliteitProps {
  /** Text color of the logo. Defaults to the app's dark text color. */
  color?: string;
}

function LogoDashboardDeelmobiliteit({
  color = '#343E47'
}: LogoDashboardDeelmobiliteitProps) {
  return (
    <div className="">
      <div style={{
        font: 'normal normal bold 20px/24px Inter',
        color
      }}>
        Dashboard Deelmobiliteit
      </div>
      <div style={{
        width: '155px',
        marginTop: '4px',
        borderBottom: '3px solid #15AEEF'
      }} />
    </div>
  )
}

export default LogoDashboardDeelmobiliteit;
