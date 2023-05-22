import './FormLabel.css';

function FormLabel({
  children,
  htmlFor,
  classes
}: {
  children?: any,
  htmlFor?: string,
  classes?: string
}, ref) {
  return <label className={`
    FormLabel
    ${classes}
    block
    font-inter
    cursor-pointer
  `} htmlFor={htmlFor}
  >
    {children}
  </label>
}

export default FormLabel;
