
function Tag({
  title,
  backgroundColor
}) {
  return (
    <div
      className="
        inline-block
        rounded
        text-white
        px-2
        py-2
        mr-2
        mb-2
        text-sm
      "
      style={{backgroundColor: backgroundColor}}
    >
      {title}
    </div>
  )
}

export default Tag;
