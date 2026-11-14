import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader for Tabular Data (Admin desks, lists, tables)
 *
 * @param {Object} props
 * @param {number} [props.rows=5] - Number of table body rows
 * @param {number} [props.columns=4] - Number of columns
 * @param {boolean} [props.showHeader=true] - Whether to render table header skeleton
 * @param {string} [props.className] - Optional extra wrapper class
 */
export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}) => {
  const columnIndices = Array.from({ length: columns }, (_, i) => i);
  const rowIndices = Array.from({ length: rows }, (_, i) => i);

  return (
    <div
      className={`tw-skeleton-table-wrapper ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading table data..."
    >
      <table className="tw-skeleton-table">
        {showHeader && (
          <thead>
            <tr>
              {columnIndices.map((colIdx) => (
                <th key={colIdx}>
                  <Skeleton
                    variant="text"
                    width={colIdx === 0 ? '60%' : '75%'}
                    height={16}
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rowIndices.map((rowIdx) => (
            <tr key={rowIdx}>
              {columnIndices.map((colIdx) => {
                const widths = ['80%', '65%', '90%', '70%', '55%'];
                const width = widths[colIdx % widths.length];
                return (
                  <td key={colIdx}>
                    <Skeleton variant="text" width={width} height={16} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;

