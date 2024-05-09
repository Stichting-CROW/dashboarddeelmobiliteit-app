import {themes} from '../../themes';

function FormInput({
  type,
  name,
  autofocus,
  defaultValue,
  value,
  placeholder,
  min,
  disabled,
  id,
  autoComplete,
  classes,
  onChange,
}: {
  type?: any,
  name?: any,
  autofocus?: any,
  defaultValue?: any,
  value?: any,
  placeholder?: any,
  min?: any,
  disabled?: any,
  id?: any,
  autoComplete?: any,
  classes?: any,
  onChange?: any,
}, ref) {
  return <div className="FormInput">
    <input
      type={type}
      name={name}
      autoFocus={autofocus}
      autoComplete={autoComplete}
      id={id}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      className={`
        rounded-lg
        inline-block
        border-solid border-2
        px-2
        py-2
        mr-2
        mb-2
        text-sm
        ${classes}
      `}
      style={themes['white']}
    />
  </div>
}

export default FormInput;
