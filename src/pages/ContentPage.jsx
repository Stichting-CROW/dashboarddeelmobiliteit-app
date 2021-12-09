export default function ContentPage(props) {
  return (
    <div style={{
      paddingTop: '51px',
      overflowY: 'auto',
      height: '100vh'
    }}>
      {props.children}
    </div>
  );
}
