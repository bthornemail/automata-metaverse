import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Filter } from 'lucide-react';
import { BaseFile, BaseRow, BaseFilter, BaseSort } from '../../services/bases-service';

interface BaseTableProps {
  base: BaseFile;
  filters?: BaseFilter[];
  sort?: BaseSort[];
  searchQuery?: string;
  limit?: number;
  fields?: string[];
  onRowClick?: (row: BaseRow) => void;
  editable?: boolean;
  onFiltersChange?: (filters: BaseFilter[]) => void;
  onSortChange?: (sort: BaseSort[]) => void;
  onSearchChange?: (query: string) => void;
}

export const BaseTable: React.FC<BaseTableProps> = ({
  base,
  filters = [],
  sort = [],
  searchQuery = '',
  limit,
  fields,
  onRowClick,
  editable = false,
  onFiltersChange,
  onSortChange,
  onSearchChange
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = limit || 50;

  // Filter and sort rows
  const processedRows = useMemo(() => {
    let result = [...base.data];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
    }

    // Apply filters
    if (filters.length > 0) {
      result = result.filter(row => {
        return filters.every(filter => {
          const value = row[filter.field];
          
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'notEquals':
              return value !== filter.value;
            case 'contains':
              return String(value).includes(String(filter.value));
            case 'notContains':
              return !String(value).includes(String(filter.value));
            case 'isEmpty':
              return value === null || value === undefined || value === '';
            case 'isNotEmpty':
              return value !== null && value !== undefined && value !== '';
            case 'greaterThan':
              return Number(value) > Number(filter.value);
            case 'lessThan':
              return Number(value) < Number(filter.value);
            case 'greaterThanOrEqual':
              return Number(value) >= Number(filter.value);
            case 'lessThanOrEqual':
              return Number(value) <= Number(filter.value);
            default:
              return true;
          }
        });
      });
    }

    // Apply sort
    if (sort.length > 0) {
      result.sort((a, b) => {
        for (const sortItem of sort) {
          const aValue = a[sortItem.field];
          const bValue = b[sortItem.field];
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;
          
          if (comparison !== 0) {
            return sortItem.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [base.data, filters, sort, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / rowsPerPage);
  const paginatedRows = processedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Fields to display
  const fieldsToShow = fields || base.schema.fields.map(f => f.name);

  const handleSort = (fieldName: string) => {
    if (!onSortChange) return;

    const existingSort = sort.find(s => s.field === fieldName);
    let newSort: BaseSort[];

    if (existingSort) {
      if (existingSort.direction === 'asc') {
        newSort = sort.map(s => 
          s.field === fieldName ? { ...s, direction: 'desc' } : s
        );
      } else {
        newSort = sort.filter(s => s.field !== fieldName);
      }
    } else {
      newSort = [...sort, { field: fieldName, direction: 'asc' }];
    }

    onSortChange(newSort);
  };

  const getSortIcon = (fieldName: string) => {
    const sortItem = sort.find(s => s.field === fieldName);
    if (!sortItem) return <ArrowUpDown size={14} />;
    return sortItem.direction === 'asc' 
      ? <ArrowUp size={14} />
      : <ArrowDown size={14} />;
  };

  const handleExport = (format: 'csv' | 'json' | 'jsonl') => {
    const data = paginatedRows.map(row => {
      const entry: any = {};
      fieldsToShow.forEach(field => {
        entry[field] = row[field];
      });
      return entry;
    });

    let content = '';
    let filename = '';

    if (format === 'csv') {
      const headers = fieldsToShow.join(',');
      const rows = data.map(row => 
        fieldsToShow.map(field => {
          const value = row[field];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      );
      content = [headers, ...rows].join('\n');
      filename = 'export.csv';
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = 'export.json';
    } else {
      content = data.map(row => JSON.stringify(row)).join('\n');
      filename = 'export.jsonl';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="base-table-container">
      <div className="table-toolbar">
        {onSearchChange && (
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search rows..."
              className="search-input"
            />
          </div>
        )}

        <div className="export-buttons">
          <button onClick={() => handleExport('csv')} className="btn btn-sm">
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn btn-sm">
            <Download size={14} />
            Export JSON
          </button>
          <button onClick={() => handleExport('jsonl')} className="btn btn-sm">
            <Download size={14} />
            Export JSONL
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="base-table">
          <thead>
            <tr>
              {fieldsToShow.map(fieldName => {
                const field = base.schema.fields.find(f => f.name === fieldName);
                return (
                  <th
                    key={fieldName}
                    onClick={() => handleSort(fieldName)}
                    className={onSortChange ? 'sortable' : ''}
                  >
                    <div className="th-content">
                      <span>{field?.name || fieldName}</span>
                      {onSortChange && getSortIcon(fieldName)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {fieldsToShow.map(fieldName => (
                  <td key={fieldName}>
                    {formatCellValue(row[fieldName])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-sm"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages} ({processedRows.length} rows)
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? '✓' : '';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
