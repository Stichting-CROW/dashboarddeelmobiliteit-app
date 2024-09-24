import * as React from "react";

function SearchBarInput({
  value,
  filterChanged,
  afterHtml
}: {
  value?: string,
  filterChanged: Function,
  afterHtml?: any,
}) {
  // const dispatch = useDispatch();

  return (
    <>
      <input
        type="search"
        name=""
        placeholder="Vind een zone"
        className="
          sticky top-0 z-10
          h-12
          w-full
          rounded-3xl
          px-4
          shadow-md
        "
        onChange={(e) => {
          filterChanged(e);
        }}
        value={value}
      />
      {afterHtml ? afterHtml : ''}
    </>
  );
}

export default SearchBarInput;
