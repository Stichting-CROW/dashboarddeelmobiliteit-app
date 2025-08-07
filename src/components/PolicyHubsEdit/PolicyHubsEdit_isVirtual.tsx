import center from '@turf/center';

export const PolicyHubsEdit_isVirtual = ({
    hubData,
    setHubData,
}) => {
    if(! hubData) return <>
        Zone data wordt geladen..
    </>

    const updateIsVirtual = (key: string) => {
        if(key === 'is_virtual') {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    is_virtual: true
                }
            });
        }
        else {
            setHubData({
                ...hubData,
                stop: {
                    ...hubData.stop,
                    is_virtual: false
                }
            });
        }
    }

    return  (
        <div className={`
            mt-2
            ${hubData.geography_type === 'stop' ? 'visible' : 'invisible'}
        `}>
            <div className="
                flex
                rounded-lg bg-white
                border-solid
                border
                border-gray-400
                text-sm
            ">
                {[
                    {name: 'is_virtual', title: 'Virtuele hub', color: '#15aeef'},
                    {name: 'is_not_virtual', title: 'Fysieke hub', color: '#15aeef'}
                ].map(x => {
                    return <div className={`
                        ${(hubData?.stop?.is_virtual === true && x.name === 'is_virtual') ? 'Button-orange text-white' : 'text-gray-500'}
                        ${(hubData?.stop?.is_virtual === false && x.name === 'is_not_virtual') ? 'Button-orange text-white' : 'text-gray-500'}
                        cursor-pointer
                        flex-1
                        
                        rounded-lg
                        text-center
                        h-10
                        flex
                        flex-col
                        justify-center
                    `}
                    style={{
                        backgroundColor: `${hubData.geography_type === x.name ? x.color : ''}`
                    }}
                    key={x.name}
                    onClick={() => {
                        updateIsVirtual(x.name);
                    }}
                    >
                        {x.title}
                    </div>
                })}
            </div>
        </div>
    )
}
