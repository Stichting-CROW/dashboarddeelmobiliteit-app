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
  interface RowWithPermits {
    rowItem: RowData;
    permitsForRow: PermitLimitRecord[];
    severity: 'red' | 'green' | 'grey';
    index: number;
  }

  // Group permits per row and determine severity based on KPI compliance:
  // - 'red'   => at least one permit in the row has overallCompliance === 'red'
  // - 'green' => no red rows, but at least one permit has overallCompliance === 'green'
  // - 'grey'  => only grey / unknown compliance
  const rowsWithPermits: RowWithPermits[] = rowData
    .map<RowWithPermits | null>((rowItem, index) => {
      const permitsForRow = filterPermits
        ? filterPermits(permits, rowItem)
        : permits;

      if (!permitsForRow || permitsForRow.length === 0) {
        return null;
      }

      let hasRed = false;
      let hasGreen = false;

      for (const permit of permitsForRow) {
        if (permit.overallCompliance === 'red') {
          hasRed = true;
          break;
        }
        if (permit.overallCompliance === 'green') {
          hasGreen = true;
        }
      }

      const severity: 'red' | 'green' | 'grey' =
        hasRed ? 'red' : hasGreen ? 'green' : 'grey';

      return {
        rowItem,
        permitsForRow,
        severity,
        index,
      };
    })
    .filter((row): row is RowWithPermits => row !== null);

  // Sort rows by severity: red first, then green, then grey-only.
  // Within each severity group, keep the original order (by index).
  const severityOrder: Record<'red' | 'green' | 'grey', number> = {
    red: 0,
    green: 1,
    grey: 2,
  };

  const sortedRows = rowsWithPermits.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return a.index - b.index;
  });

  return (
    <div className={`w-full ${className}`}>
      {sortedRows.map(({ rowItem, permitsForRow }) => (
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
      ))}
    </div>
  );
};

export default PermitCardCollection; 