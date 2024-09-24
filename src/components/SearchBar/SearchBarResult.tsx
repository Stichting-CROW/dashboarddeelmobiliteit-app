import React from 'react';

function SearchBarResult({
  title,
  subTitle,
  onClick
}: {
  title: string,
  subTitle?: string,
  onClick?: Function
}) {
  const compact = true;

  return (
    <div
      className={`
        SearchBarResult
        relative
        flex w-full
        justify-between
        border-b
        border-solid
        border-gray-300
        px-5 pb-5
        pt-5
        cursor-pointer
        ${compact
          ? 'bg-white'
          : 'shadow-lg'
        }
      `}
      style={{
        backgroundColor: !compact ? 'rgba(31, 153, 210, 0.1)' : undefined
      }}
      onClick={() => {
        if(onClick) onClick();
      }}
    >
      <div
        data-name="left"
        className={`
          mr-2 hidden
          align-middle
          sm:inline-block
        `}
        style={{
          marginTop: "5px",
          borderColor: '#000',
        }}
      />
      <div data-name="right" className="flex-1">
        <div className="">
          <div className="h-6 overflow-hidden sm:h-auto">
            <b className="text-base">{title}</b>
          </div>
          <div className="text-sm text-gray-500 h-5 overflow-hidden" title={subTitle}>
            {subTitle}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchBarResult;
