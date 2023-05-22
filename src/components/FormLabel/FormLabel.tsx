import './FormLabel.css';

function FormLabel({
  children,
  classes
}: {
  children?: any,
  classes?: string
}, ref) {
  return <label className={`
    FormLabel
    ${classes}
    block
    font-bold
    font-inter
  `}>
    {children}
  </label>
}

export default FormLabel;
