import React from 'react'

import { Marker as MapMarker } from 'react-map-gl'

export const Marker = ({ marker, handleRemove }) => {
  return (
    <MapMarker
      offsetTop={-48}
      offsetLeft={-24}
      latitude={marker[1]}
      longitude={marker[0]}
    >

      <img
        onContextMenu={(x) => {
          if(x) x.preventDefault()
          handleRemove()
        }}

        src="https://img.icons8.com/color/48/000000/marker.png"

      />

    </MapMarker>

  )

}