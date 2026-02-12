import React, { useState, useMemo, useRef, useEffect } from 'react';
import moment from 'moment';
import type { GeometryOperatorModalityLimit, PerformanceIndicatorDescription } from '../../api/permitLimits';
import { updateGeometryOperatorModalityLimit, addGeometryOperatorModalityLimit, toGeometryRef } from '../../api/permitLimits';
import type { HistoryTableRow } from './permitLimitsUtils';
import { getAllKpis, toDateOnly, formatBound } from './permitLimitsUtils';

type SortColumn = 'date' | 'kpi' | 'value';
type SortDirection = 'asc' | 'desc' | null;

interface PermitLimitsTableProps {
  tableRows: HistoryTableRow[];
  limitHistory: GeometryOperatorModalityLimit[] | null;
  kpiDescriptions: PerformanceIndicatorDescription[];
  mode: 'normal' | 'admin';
  token: string;
  municipality: string;
  provider_system_id: string;
  vehicle_type: string;
  propulsion_type?: string;
  showPermitLimitsEditor?: boolean;
  onAddNew?: () => void;
  onEditRow?: (date: string) => void;
  onRecordUpdated: () => void;
}

const PermitLimitsTable: React.FC<PermitLimitsTableProps> = ({
  tableRows,
  limitHistory,
  kpiDescriptions,
  mode,
  token,
  municipality,
  provider_system_id,
  vehicle_type,
  propulsion_type = 'electric',
  showPermitLimitsEditor = false,
  onAddNew,
  onEditRow,
  onRecordUpdated,
}) => {
  // Sorting state - default to date descending
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Inline editing state (empty value = limit disabled)
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add new row state
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newRowDate, setNewRowDate] = useState<string>(moment().add(1, 'day').format('YYYY-MM-DD'));
  const [newRowKpiKey, setNewRowKpiKey] = useState<string>('');
  const [newRowValue, setNewRowValue] = useState<number | ''>('');
  const [isAdding, setIsAdding] = useState(false);
  const newRowInputRef = useRef<HTMLInputElement>(null);

  // Generate unique row key
  const getRowKey = (row: HistoryTableRow): string => {
    return `${row.effective_date}-${row.kpiKey}`;
  };

  // Handle column header click - cycle through: asc -> desc -> asc
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort table rows based on current sort column and direction
  const sortedRows = useMemo(() => {
    let editingKpiKey: string | null = null;

    if (editingRowKey) {
      const editingRow = tableRows.find(row => getRowKey(row) === editingRowKey);
      if (editingRow) {
        editingKpiKey = editingRow.kpiKey;
      }
    } else if (!showPermitLimitsEditor && isAddingNewRow && newRowKpiKey) {
      editingKpiKey = newRowKpiKey;
    }

    let filteredRows = tableRows;
    if (editingKpiKey) {
      filteredRows = tableRows.filter(row => row.kpiKey === editingKpiKey);
    }

    if (!sortDirection) return filteredRows;

    const sorted = [...filteredRows].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'date':
          comparison = moment(a.effective_date).diff(moment(b.effective_date));
          break;
        case 'kpi':
          comparison = a.kpiDescription.localeCompare(b.kpiDescription);
          break;
        case 'value':
          if (a.thresholdValue === null && b.thresholdValue === null) {
            comparison = 0;
          } else if (a.thresholdValue === null) {
            comparison = 1;
          } else if (b.thresholdValue === null) {
            comparison = -1;
          } else {
            comparison = a.thresholdValue - b.thresholdValue;
          }
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tableRows, sortColumn, sortDirection, editingRowKey, isAddingNewRow, newRowKpiKey, showPermitLimitsEditor]);

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column || !sortDirection) return null;
    return (
      <span className="ml-1 text-gray-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    );
  };

  useEffect(() => {
    if (editingRowKey && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingRowKey]);

  const handleEditClick = (row: HistoryTableRow) => {
    setEditingRowKey(getRowKey(row));
    setEditingValue(row.isActive && row.thresholdValue !== null ? row.thresholdValue : '');
  };

  const handleSaveClick = async (row: HistoryTableRow) => {
    if (!limitHistory || !token) {
      alert('Fout: Kan record niet bijwerken');
      return;
    }

    const fullRecord = limitHistory.find(
      (r) =>
        toDateOnly(r.effective_date) === row.effective_date &&
        r.geometry_operator_modality_limit_id === row.geometry_operator_modality_limit_id
    );

    if (!fullRecord || !fullRecord.geometry_operator_modality_limit_id) {
      alert('Fout: Record niet gevonden');
      return;
    }

    if (mode !== 'admin' && moment(fullRecord.effective_date).isBefore(moment(), 'day')) {
      alert('Alleen toekomstige datums kunnen worden gewijzigd.');
      return;
    }

    if (typeof editingValue === 'number' && editingValue < 0) {
      alert('Fout: Ongeldige waarde');
      return;
    }

    const newLimits = { ...fullRecord.limits };
    if (editingValue === '' || (typeof editingValue === 'number' && editingValue < 0)) {
      delete newLimits[row.kpiKey];
    } else {
      newLimits[row.kpiKey] = editingValue as number;
    }

    const currentVal = fullRecord.limits[row.kpiKey];
    const isCurrentlyActive = currentVal !== undefined && currentVal !== null;
    const willBeActive = row.kpiKey in newLimits;
    const newVal = newLimits[row.kpiKey];
    if (isCurrentlyActive === willBeActive && (willBeActive ? currentVal === newVal : true)) {
      setEditingRowKey(null);
      setEditingValue('');
      return;
    }

    setIsSaving(true);

    try {
      const updatedRecord: GeometryOperatorModalityLimit = {
        ...fullRecord,
        limits: newLimits,
      };

      const result = await updateGeometryOperatorModalityLimit(token, updatedRecord, mode === 'admin');

      if (result) {
        setEditingRowKey(null);
        setEditingValue('');
        onRecordUpdated();
      } else {
        alert('Fout bij bijwerken van record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      alert(error instanceof Error ? error.message : 'Fout bij bijwerken van record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    setEditingRowKey(null);
    setEditingValue('');
  };

  const availableKpis = useMemo(() => getAllKpis(kpiDescriptions), [kpiDescriptions]);

  const activeEffectiveDate = useMemo(() => {
    if (!limitHistory || limitHistory.length === 0) return null;
    const today = moment().format('YYYY-MM-DD');
    const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    for (let i = 0; i < sorted.length; i++) {
      const startdate = toDateOnly(sorted[i].effective_date);
      const nextStart = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : '9999-12-31';
      if (today >= startdate && (nextStart === '9999-12-31' ? today <= nextStart : today < nextStart)) {
        return startdate;
      }
    }
    return null;
  }, [limitHistory]);

  const getCurrentValueForDateAndKpi = (date: string, kpiKey: string): number | null => {
    if (!limitHistory || !date || !kpiKey) return null;

    const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
    const d = toDateOnly(date);
    let data: GeometryOperatorModalityLimit | null = null;
    for (let i = 0; i < sorted.length; i++) {
      const startdate = toDateOnly(sorted[i].effective_date);
      const nextStart = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : '9999-12-31';
      if (d >= startdate && (nextStart === '9999-12-31' ? d <= nextStart : d < nextStart)) {
        data = sorted[i];
        break;
      }
    }

    if (!data) return null;

    const value = data.limits[kpiKey];
    if (value === undefined || value === null || typeof value !== 'number') return null;
    return value;
  };

  const handleAddNewRowClick = () => {
    setIsAddingNewRow(true);
    setNewRowDate(moment().add(1, 'day').format('YYYY-MM-DD'));
    setNewRowKpiKey('');
    setNewRowValue('');
  };

  const handleCancelAddNewRow = () => {
    setIsAddingNewRow(false);
    setNewRowDate(moment().add(1, 'day').format('YYYY-MM-DD'));
    setNewRowKpiKey('');
    setNewRowValue('');
  };

  const handleSaveAddNewRow = async () => {
    if (!token) {
      alert('Fout: Kan record niet toevoegen');
      return;
    }

    if (!newRowKpiKey) {
      alert('Fout: Selecteer een KPI');
      return;
    }

    if (newRowValue !== '' && (typeof newRowValue !== 'number' || newRowValue < 0)) {
      alert('Fout: Voer een geldige waarde in (of leeg voor uitschakelen)');
      return;
    }

    if (mode !== 'admin' && newRowDate < moment().format('YYYY-MM-DD')) {
      alert('Alleen toekomstige datums kunnen worden gewijzigd.');
      return;
    }

    const kpi = availableKpis.find((k) => k.kpiKey === newRowKpiKey);
    if (!kpi) {
      alert('Fout: Ongeldige KPI');
      return;
    }

    setIsAdding(true);

    try {
      let existingRecord: GeometryOperatorModalityLimit | null = null;
      if (limitHistory) {
        const sorted = [...limitHistory].sort((a, b) => toDateOnly(a.effective_date).localeCompare(toDateOnly(b.effective_date)));
        const d = toDateOnly(newRowDate);
        for (let i = 0; i < sorted.length; i++) {
          const startdate = toDateOnly(sorted[i].effective_date);
          const nextStart = i < sorted.length - 1 ? toDateOnly(sorted[i + 1].effective_date) : '9999-12-31';
          if (d >= startdate && (nextStart === '9999-12-31' ? d <= nextStart : d < nextStart)) {
            existingRecord = sorted[i];
            break;
          }
        }
      }

      const geometry_ref = toGeometryRef(municipality);
      const limits: Record<string, number> = existingRecord ? { ...existingRecord.limits } : {};

      if (newRowValue !== '' && typeof newRowValue === 'number') {
        limits[newRowKpiKey] = newRowValue;
      } else {
        delete limits[newRowKpiKey];
      }

      const recordData: GeometryOperatorModalityLimit = {
        operator: provider_system_id,
        geometry_ref,
        form_factor: vehicle_type,
        propulsion_type,
        effective_date: newRowDate,
        limits,
      };

      const allowChange = mode === 'admin';
      const result =
        existingRecord && existingRecord.geometry_operator_modality_limit_id
          ? await updateGeometryOperatorModalityLimit(token, {
              ...recordData,
              geometry_operator_modality_limit_id: existingRecord.geometry_operator_modality_limit_id,
              ...(existingRecord.end_date !== undefined && { end_date: existingRecord.end_date }),
            }, allowChange)
          : await addGeometryOperatorModalityLimit(token, recordData, allowChange);

      if (result) {
        setIsAddingNewRow(false);
        setNewRowDate(moment().add(1, 'day').format('YYYY-MM-DD'));
        setNewRowKpiKey('');
        setNewRowValue('');
        onRecordUpdated();
      } else {
        alert('Fout bij toevoegen van record');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert(error instanceof Error ? error.message : 'Fout bij toevoegen van record');
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (isAddingNewRow && newRowInputRef.current) {
      newRowInputRef.current.focus();
    }
  }, [isAddingNewRow]);

  const handleValueChange = (value: string) => {
    if (value === '') {
      setEditingValue('');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setEditingValue(numValue);
      }
    }
  };

  return (
    <>
      <div
        className={`permits-table-container`}
      >
        <table className="permits-table">
          <thead>
            <tr className="permits-table-header">
              <th
                className="permits-table-header-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('date')}
              >
                Datum (vanaf)
                {renderSortIndicator('date')}
              </th>
              <th
                className="permits-table-header-cell cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('kpi')}
              >
                KPI (omschrijving)
                {renderSortIndicator('kpi')}
              </th>
              <th
                className="permits-table-header-cell cursor-pointer hover:bg-gray-100 select-none text-left"
                onClick={() => handleSort('value')}
              >
                grenswaarde
                {renderSortIndicator('value')}
              </th>
              <th className="permits-table-header-cell">Acties</th>
            </tr>
          </thead>
          <tbody>
            {(showPermitLimitsEditor || (editingRowKey === null && !isAddingNewRow)) && (
              <tr className="permits-table-row">
                <td colSpan={4} className="permits-table-cell text-center py-2">
                  <button
                    type="button"
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={showPermitLimitsEditor ? onAddNew : handleAddNewRowClick}
                    disabled={showPermitLimitsEditor ? false : isAddingNewRow}
                  >
                    + Grenswaarde toevoegen
                  </button>
                </td>
              </tr>
            )}
            {!showPermitLimitsEditor && isAddingNewRow && (
              <tr className="permits-table-row bg-blue-50">
                <td className="permits-table-cell-nowrap">
                  <input
                    type="date"
                    value={newRowDate}
                    onChange={(e) => setNewRowDate(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded"
                    disabled={isAdding}
                    {...(mode !== 'admin' ? { min: moment().format('YYYY-MM-DD') } : {})}
                  />
                </td>
                <td className="permits-table-cell">
                  <select
                    value={newRowKpiKey}
                    onChange={(e) => {
                      const kpiKey = e.target.value;
                      setNewRowKpiKey(kpiKey);
                      const existing = kpiKey ? getCurrentValueForDateAndKpi(newRowDate, kpiKey) : null;
                      setNewRowValue(existing !== null ? existing : ''); // prefill with value at selected date
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    disabled={isAdding}
                  >
                    <option value="">Selecteer KPI</option>
                    {availableKpis.map(kpi => (
                      <option key={kpi.kpiKey} value={kpi.kpiKey}>
                        {kpi.description.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="permits-table-cell-center">
                  <span className="inline-flex items-center gap-1">
                    {newRowKpiKey && `${formatBound(availableKpis.find(k => k.kpiKey === newRowKpiKey)?.description.bound)} `}
                    <input
                      ref={newRowInputRef}
                      type="number"
                      min="0"
                      step="1"
                      value={newRowValue}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        if (val === '' || (typeof val === 'number' && val >= 0)) {
                          setNewRowValue(val);
                        }
                      }}
                      placeholder={newRowDate && newRowKpiKey ? (getCurrentValueForDateAndKpi(newRowDate, newRowKpiKey)?.toString() || '') : ''}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      disabled={isAdding}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveAddNewRow();
                        } else if (e.key === 'Escape') {
                          handleCancelAddNewRow();
                        }
                      }}
                    />
                    {newRowKpiKey && (availableKpis.find(k => k.kpiKey === newRowKpiKey)?.description.unit || '').toLowerCase() === 'percentage' && '%'}
                    {newRowValue !== '' && (
                      <button
                        type="button"
                        onClick={() => setNewRowValue('')}
                        disabled={isAdding}
                        className="px-2 py-0.5 rounded-full text-xs bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                        title="Leegmaken"
                      >
                        geen
                      </button>
                    )}
                  </span>
                </td>
                <td className="permits-table-cell-center">
                  <button
                    title="Opslaan"
                    className="permits-table-action-button"
                    onClick={handleSaveAddNewRow}
                    disabled={isAdding || !newRowKpiKey}
                    style={{ opacity: (isAdding || !newRowKpiKey) ? 0.5 : 1 }}
                  >
                    {isAdding ? (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline animate-spin" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2" fill="none"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" fill="#22c55e"/>
                      </svg>
                    )}
                  </button>
                  <button
                    title="Annuleren"
                    className="permits-table-delete-button"
                    onClick={handleCancelAddNewRow}
                    disabled={isAdding}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" fill="#ef4444"/>
                    </svg>
                  </button>
                </td>
              </tr>
            )}
            {sortedRows.length > 0 ? sortedRows.map((row, index) => {
              const fullRecord = limitHistory?.find(
                (r) =>
                  toDateOnly(r.effective_date) === row.effective_date &&
                  r.geometry_operator_modality_limit_id === row.geometry_operator_modality_limit_id
              );
              const allowChange = mode === 'admin' || (fullRecord && toDateOnly(fullRecord.effective_date) >= moment().format('YYYY-MM-DD'));

              const rowKey = getRowKey(row);
              const isEditing = !showPermitLimitsEditor && editingRowKey === rowKey;
              const isAnyRowEditing = !showPermitLimitsEditor && editingRowKey !== null;

              return (
                <tr
                  key={`${row.effective_date}-${row.kpiKey}-${index}`}
                  className={`permits-table-row ${activeEffectiveDate === row.effective_date ? 'bg-gray-200' : ''} ${!row.isActive ? 'opacity-60' : ''}`}
                >
                  <td className="permits-table-cell-nowrap">{row.effectiveDate}</td>
                  <td className="permits-table-cell">{row.kpiDescription}</td>
                  <td className="permits-table-cell">
                    {isEditing ? (
                      <span className="inline-flex items-center gap-1">
                        {row.maxOrMin}
                        <input
                          ref={inputRef}
                          type="number"
                          min="0"
                          step="1"
                          value={editingValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveClick(row);
                            } else if (e.key === 'Escape') {
                              handleCancelClick();
                            }
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          disabled={isSaving}
                          placeholder={row.isActive ? '' : 'leeg = uitschakelen'}
                        />
                        {row.eenheid === 'percentage' && '%'}
                        {editingValue !== '' && (
                          <button
                            type="button"
                            onClick={() => setEditingValue('')}
                            disabled={isSaving}
                            className="px-2 py-0.5 rounded-full text-xs bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                            title="Leegmaken"
                          >
                            geen
                          </button>
                        )}
                      </span>
                    ) : (
                      row.isActive ? (row.thresholdValue != null ? `${row.maxOrMin} ${row.thresholdValue}${row.eenheid === 'percentage' ? '%' : ''}` : '') : <span className="font-bold">---</span>
                    )}
                  </td>
                  <td className="permits-table-cell-center">
                    {isEditing ? (
                      <>
                        <button
                          title="Opslaan"
                          className="permits-table-action-button"
                          onClick={() => handleSaveClick(row)}
                          disabled={isSaving}
                          style={{ opacity: isSaving ? 0.5 : 1 }}
                        >
                          {isSaving ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline animate-spin" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2" fill="none"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg">
                              <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" fill="#22c55e"/>
                            </svg>
                          )}
                        </button>
                        <button
                          title="Annuleren"
                          className="permits-table-delete-button"
                          onClick={handleCancelClick}
                          disabled={isSaving}
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" fill="#ef4444"/>
                          </svg>
                        </button>
                      </>
                    ) : allowChange && fullRecord && !isAnyRowEditing && (
                      <>
                        <button
                          title="Aanpassen"
                          className="permits-table-action-button"
                          onClick={() =>
                            showPermitLimitsEditor && onEditRow
                              ? onEditRow(row.effective_date)
                              : handleEditClick(row)
                          }
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="inline" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.85 2.85a2.121 2.121 0 0 1 3 3l-9.193 9.193a2 2 0 0 1-.708.464l-3.5 1.25a.5.5 0 0 1-.637-.637l1.25-3.5a2 2 0 0 1 .464-.708L14.85 2.85zm2.12.88a1.121 1.121 0 0 0-1.586 0l-1.293 1.293 1.586 1.586 1.293-1.293a1.121 1.121 0 0 0 0-1.586zm-2.293 2.293l-8.5 8.5-.75 2.1 2.1-.75 8.5-8.5-1.85-1.85z" fill="#666"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            }            ) : (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-4">
                  Geen historische limieten gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PermitLimitsTable;
