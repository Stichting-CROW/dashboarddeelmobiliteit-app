import {themes} from '../../themes';

function FormTextarea({
  name,
  style,
  value,
  defaultValue,
  placeholder,
  disabled,
  id,
  classes,
  onChange,
}: {
  name?: any,
  placeholder?: any,
  disabled?: any,
  id?: any,
  classes?: any,
  onChange?: any,
  value?: any,
  defaultValue?: any,
  style?: any,
}, ref) {
  return <div className="FormTextarea">
    <textarea
      name={name}
      id={id}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
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
      style={Object.assign({}, themes['white'], style)}
      value={value}
      defaultValue={defaultValue}
    />
  </div>
}

export default FormTextarea;
