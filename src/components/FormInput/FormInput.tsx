import {themes} from '../../themes';

function FormInput({
  type,
  name,
  defaultValue,
  value,
  placeholder,
  min,
  disabled,
  id,
  autoComplete,
  classes,
  onChange,
}, ref) {
  return <div className="FormInput">
    <input
      type={type}
      name={name}
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
