export const ContextMenu = ({
  contextMenu,
  setContextMenu,
  onDeletePolygonFromMultiPolygon,
}: {
  contextMenu: any;
  setContextMenu: any;
  onDeletePolygonFromMultiPolygon: () => void;
}): JSX.Element => {
  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-lg py-2 min-w-[150px]"
      style={{ 
        left: contextMenu.x, 
        top: contextMenu.y 
      }}
     onClick={(e) => e.stopPropagation()} // Prevent menu from closing when clicking inside
  >
    <button 
      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
      onClick={() => {
        console.log('delete polygon');
        onDeletePolygonFromMultiPolygon();
        setContextMenu(prev => ({ ...prev, visible: false }));
      }}
    >
        Verwijder dit gedeelte
      </button>
    </div>
  )
}
