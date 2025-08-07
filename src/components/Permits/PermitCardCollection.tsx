import React from 'react';
import type { PermitLimitRecord } from '../../api/permitLimits';

export interface RowData {
  id: string;
  name: string;
  icon?: string;
  [key: string]: any;
}

export interface PermitCardCollectionProps {
  rowData: RowData[];
  permits: PermitLimitRecord[];
  renderHeader: (rowItem: RowData) => React.ReactNode;
  renderCards: (permits: PermitLimitRecord[], rowItem: RowData) => React.ReactNode;
  filterPermits?: (permits: PermitLimitRecord[], rowItem: RowData) => PermitLimitRecord[];
  className?: string;
}

const PermitCardCollection: React.FC<PermitCardCollectionProps> = ({
  rowData,
  permits,
  renderHeader,
  renderCards,
  filterPermits,
  className = ""
}) => {
  return (
    <div className={`w-full ${className}`}>
      {rowData.map((rowItem) => {
        // Filter permits for this row item
        const permitsForRow = filterPermits 
          ? filterPermits(permits, rowItem)
          : permits;

        if (!permitsForRow || permitsForRow.length === 0) {
          return null;
        }

        return (
          <div key={`row-${rowItem.id}`} className="permits-collection-row">
            <div className="permits-collection-row-content">
              {/* Header card - fixed to left side */}
              <div className="permits-collection-header">
                <div className="permits-collection-header-content">
                  {renderHeader(rowItem)}
                </div>
              </div>
              
              {/* Cards: simple horizontal scrollable container */}
              <div className="permits-collection-cards">
                <div className="permits-collection-cards-content">
                  {renderCards(permitsForRow, rowItem)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PermitCardCollection; 