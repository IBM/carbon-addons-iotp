import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  TableRow,
  TableExpandRow,
  TableCell,
  Checkbox,
  RadioButton,
} from 'carbon-components-react';
import classnames from 'classnames';

import { settings } from '../../../../constants/Settings';
import RowActionsCell from '../RowActionsCell/RowActionsCell';
import TableCellRenderer from '../../TableCellRenderer/TableCellRenderer';
import {
  RowActionPropTypes,
  RowActionErrorPropTypes,
  TableColumnsPropTypes,
} from '../../TablePropTypes';
import { stopPropagationAndCallback } from '../../../../utils/componentUtilityFunctions';

const { prefix, iotPrefix } = settings;

const propTypes = {
  /** What column ordering is currently applied to the table */
  ordering: PropTypes.arrayOf(
    PropTypes.shape({
      columnId: PropTypes.string.isRequired,
      /* Visibility of column in table, defaults to false */
      isHidden: PropTypes.bool,
      /** for each column you can register a render callback function that is called with this object payload
       * {
       *    value: PropTypes.any (current cell value),
       *    columnId: PropTypes.string,
       *    rowId: PropTypes.string,
       *    row: PropTypes.object like this {col: value, col2: value}
       * }, you should return the node that should render within that cell */
      renderDataFunction: PropTypes.func,
    })
  ).isRequired,
  /** internationalized label */
  selectRowAria: PropTypes.string,
  /** internationalized label  */
  overflowMenuAria: PropTypes.string,
  /** internationalized label */
  clickToExpandAria: PropTypes.string,
  /** internationalized label  */
  clickToCollapseAria: PropTypes.string,
  /** List of columns */
  columns: TableColumnsPropTypes.isRequired,
  /** table wide options */
  options: PropTypes.shape({
    hasRowSelection: PropTypes.oneOf(['multi', 'single', false]),
    hasRowExpansion: PropTypes.bool,
    hasRowNesting: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.shape({
        /** If the hierarchy only has 1 nested level of children */
        hasSingleNestedHierarchy: PropTypes.bool,
      }),
    ]),
    hasRowActions: PropTypes.bool,
    shouldExpandOnRowClick: PropTypes.bool,
    wrapCellText: PropTypes.oneOf(['always', 'never', 'auto', 'alwaysTruncate']).isRequired,
    truncateCellText: PropTypes.bool.isRequired,
    /** use white-space: pre; css when true */
    preserveCellWhiteSpace: PropTypes.bool,
    /** use raidon button on single selection */
    useRadioButtonSingleSelect: PropTypes.bool,
  }),

  /** The unique row id */
  id: PropTypes.string.isRequired,
  /** The unique id for the table */
  tableId: PropTypes.string.isRequired,
  /** some columns might be hidden, so total columns has the overall total */
  totalColumns: PropTypes.number.isRequired,

  /** contents of the row each object value is a render-able node keyed by column id */
  values: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.node, PropTypes.bool, PropTypes.object, PropTypes.array])
  ).isRequired,

  /** is the row currently selected */
  isSelected: PropTypes.bool,
  /** is the row currently in an indeterminate state, i.e. some but not all children are checked */
  isIndeterminate: PropTypes.bool,
  /** is the row currently expanded */
  isExpanded: PropTypes.bool,
  /** optional row details */
  rowDetails: PropTypes.node,
  /** offset level if row is nested */
  nestingLevel: PropTypes.number,
  /** number of child rows underneath this row */
  nestingChildCount: PropTypes.number,

  /** tableActions */
  tableActions: PropTypes.shape({
    onRowSelected: PropTypes.func,
    onRowClicked: PropTypes.func,
    onApplyRowAction: PropTypes.func,
    onRowExpanded: PropTypes.func,
    onClearRowError: PropTypes.func,
  }).isRequired,
  /** optional per-row actions */
  rowActions: RowActionPropTypes,
  /** Is a row action actively running */
  isRowActionRunning: PropTypes.bool,
  /** has a row action errored out */
  rowActionsError: RowActionErrorPropTypes,
  /** I18N label for in progress */
  inProgressText: PropTypes.string,
  /** I18N label for action failed */
  actionFailedText: PropTypes.string,
  /** I18N label for learn more */
  learnMoreText: PropTypes.string,
  /** I18N label for dismiss */
  dismissText: PropTypes.string,
  locale: PropTypes.string,
  rowEditMode: PropTypes.bool,
  singleRowEditMode: PropTypes.bool,
  isSelectable: PropTypes.bool,
  singleRowEditButtons: PropTypes.element,
  /**
   * direction of document
   */
  langDir: PropTypes.oneOf(['ltr', 'rtl']),
  /** shows an additional column that can expand/shrink as the table is resized  */
  showExpanderColumn: PropTypes.bool,
  /**
   * the size passed to the table to set row height
   */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),

  /** True if this is the last child of a nested group */
  isLastChild: PropTypes.bool,
};

const defaultProps = {
  isSelected: false,
  isIndeterminate: false,
  isExpanded: false,
  selectRowAria: 'Select row',
  overflowMenuAria: 'More actions',
  clickToExpandAria: 'Click to expand.',
  clickToCollapseAria: 'Click to collapse.',
  rowActions: null,
  rowDetails: null,
  nestingLevel: 0,
  nestingChildCount: 0,
  options: {},
  rowEditMode: false,
  singleRowEditMode: false,
  singleRowEditButtons: null,
  isRowActionRunning: false,
  rowActionsError: null,
  learnMoreText: 'Learn more',
  inProgressText: 'In progress',
  dismissText: 'Dismiss',
  actionFailedText: 'Action failed',
  showExpanderColumn: false,
  langDir: 'ltr',
  locale: 'en',
  isSelectable: undefined,
  size: undefined,
  isLastChild: false,
};

const TableBodyRow = ({
  id,
  tableId,
  langDir,
  totalColumns,
  ordering,
  columns,
  locale,
  options: {
    hasRowSelection,
    hasRowExpansion,
    hasRowActions,
    hasRowNesting,
    shouldExpandOnRowClick,
    wrapCellText,
    truncateCellText,
    preserveCellWhiteSpace,
    useRadioButtonSingleSelect,
  },
  tableActions: { onRowSelected, onRowExpanded, onRowClicked, onApplyRowAction, onClearRowError },
  isExpanded,
  isSelected,
  isIndeterminate,
  selectRowAria,
  overflowMenuAria,
  clickToExpandAria,
  clickToCollapseAria,
  inProgressText,
  actionFailedText,
  learnMoreText,
  dismissText,
  isSelectable,
  values,
  nestingLevel,
  nestingChildCount,
  rowActions,
  isRowActionRunning,
  rowActionsError,
  rowDetails,
  rowEditMode,
  singleRowEditMode,
  singleRowEditButtons,
  showExpanderColumn,
  size,
  isLastChild,
}) => {
  const isEditMode = rowEditMode || singleRowEditMode;
  const singleSelectionIndicatorWidth = hasRowSelection === 'single' ? 0 : 5;
  const nestingLevelPixels = nestingLevel * 32;

  // if this a single hierarchy (i.e. only 1 level of nested children), do NOT show the gray offset
  const nestingOffset = hasRowNesting?.hasSingleNestedHierarchy
    ? 0
    : hasRowSelection === 'single'
    ? nestingLevelPixels - singleSelectionIndicatorWidth
    : nestingLevelPixels;

  const rowSelectionCell =
    hasRowSelection === 'multi' ? (
      <TableCell
        className={`${prefix}--checkbox-table-cell`}
        key={`${id}-row-selection-cell`}
        onChange={isSelectable !== false ? () => onRowSelected(id, !isSelected) : null}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`${iotPrefix}--table__cell__offset`}
          style={{ '--row-nesting-offset': `${nestingOffset}px` }}
        >
          <Checkbox
            id={`select-row-${tableId}-${id}`}
            labelText={selectRowAria}
            hideLabel
            indeterminate={isIndeterminate}
            checked={isSelected}
            disabled={isSelectable === false}
          />
        </span>
      </TableCell>
    ) : hasRowSelection === 'single' && useRadioButtonSingleSelect ? (
      <TableCell
        className={`${prefix}--radiobutton-table-cell`}
        key={`${id}-row-selection-cell`}
        onChange={isSelectable !== false ? () => onRowSelected(id, !isSelected) : null}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`${iotPrefix}--table__cell__offset`}
          style={{ '--row-nesting-offset': `${nestingOffset}px` }}
        >
          <RadioButton
            id={`select-row-${tableId}-${id}`}
            name={`select-row-${tableId}-${id}`}
            hideLabel
            labelText={selectRowAria}
            checked={isSelected}
            onClick={isSelectable !== false ? () => onRowSelected(id, !isSelected) : null}
            disabled={isSelectable === false}
          />
        </span>
      </TableCell>
    ) : null;

  const firstVisibleColIndex = ordering.findIndex((col) => !col.isHidden);
  const tableCells = (
    <Fragment key={`${tableId}-${id}`}>
      {rowSelectionCell}
      {ordering.map((col, idx) => {
        const matchingColumnMeta = columns && columns.find((column) => column.id === col.columnId);
        // initialColumnWidth for the table body cells is needed for tables that have fixed column widths
        // and table-layout:auto combination so that cell content can be truncated
        const initialColumnWidth = matchingColumnMeta && matchingColumnMeta.width;
        // if this a single hierarchy (i.e. only 1 level of nested children), do NOT show the gray offset
        const offset = firstVisibleColIndex === idx ? nestingOffset : 0;
        const align =
          matchingColumnMeta && matchingColumnMeta.align ? matchingColumnMeta.align : 'start';
        const sortable =
          matchingColumnMeta && matchingColumnMeta.isSortable
            ? matchingColumnMeta.isSortable
            : false;
        return !col.isHidden ? (
          <TableCell
            id={`cell-${tableId}-${id}-${col.columnId}`}
            key={col.columnId}
            data-column={col.columnId}
            data-offset={offset}
            offset={offset}
            align={align}
            className={classnames(`data-table-${align}`, {
              [`${iotPrefix}--table__cell--truncate`]: truncateCellText,
              [`${iotPrefix}--table__cell--sortable`]: sortable,
            })}
            width={initialColumnWidth}
          >
            <span
              className={`${iotPrefix}--table__cell__offset`}
              style={{ '--row-nesting-offset': `${offset}px` }}
            >
              {col.editDataFunction && isEditMode ? (
                col.editDataFunction({
                  value: values[col.columnId],
                  columnId: col.columnId,
                  rowId: id,
                  row: values,
                })
              ) : (
                <TableCellRenderer
                  wrapText={wrapCellText}
                  truncateCellText={truncateCellText}
                  locale={locale}
                  renderDataFunction={col.renderDataFunction}
                  isSortable={col.isSortable}
                  sortFunction={col.sortFunction}
                  isFilterable={col.filter}
                  filterFunction={col.filter?.filterFunction}
                  columnId={col.columnId}
                  rowId={id}
                  row={values}
                  preserveCellWhiteSpace={preserveCellWhiteSpace}
                >
                  {values[col.columnId]}
                </TableCellRenderer>
              )}
            </span>
          </TableCell>
        ) : null;
      })}
      {showExpanderColumn ? <TableCell key={`${tableId}-${id}-row-expander-cell`} /> : null}

      {hasRowActions && rowActions ? (
        <RowActionsCell
          id={id}
          langDir={langDir}
          tableId={tableId}
          actions={rowActions}
          isRowActionRunning={isRowActionRunning}
          isRowExpanded={isExpanded && !hasRowNesting}
          showSingleRowEditButtons={singleRowEditMode}
          singleRowEditButtons={singleRowEditButtons}
          overflowMenuAria={overflowMenuAria}
          inProgressText={inProgressText}
          actionFailedText={actionFailedText}
          onApplyRowAction={onApplyRowAction}
          learnMoreText={learnMoreText}
          dismissText={dismissText}
          rowActionsError={rowActionsError}
          onClearError={onClearRowError ? () => onClearRowError(id) : null}
          size={size}
        />
      ) : nestingLevel > 0 && hasRowActions ? (
        <TableCell key={`${tableId}-${id}-row-actions-cell`} />
      ) : undefined}
    </Fragment>
  );
  return hasRowExpansion || hasRowNesting ? (
    isExpanded ? (
      <Fragment key={id}>
        <TableExpandRow
          className={classnames(`${iotPrefix}--expandable-tablerow--expanded`, {
            [`${iotPrefix}--expandable-tablerow--indented`]: parseInt(nestingOffset, 10) > 0,
          })}
          ariaLabel={clickToCollapseAria}
          expandIconDescription={clickToCollapseAria}
          isExpanded
          isSelected={isSelected}
          hasRowSelection={hasRowSelection}
          data-row-nesting={hasRowNesting}
          data-nesting-offset={nestingOffset}
          onExpand={(evt) => stopPropagationAndCallback(evt, onRowExpanded, id, false)}
          onClick={() => {
            if (
              shouldExpandOnRowClick &&
              ((hasRowNesting && nestingChildCount) || hasRowExpansion)
            ) {
              onRowExpanded(id, false);
            }
            if (hasRowSelection === 'single' && isSelectable !== false) {
              onRowSelected(id, true);
            }
            if (isSelectable !== false) {
              onRowClicked(id);
            }
          }}
          style={{
            '--row-nesting-offset': `${nestingOffset}px`,
          }}
        >
          {tableCells}
        </TableExpandRow>
        {!hasRowNesting && (
          <TableRow
            className={classnames(`${iotPrefix}--expanded-tablerow`, {
              [`${iotPrefix}--expanded-tablerow--singly-selected`]:
                hasRowSelection === 'single' && isSelected && !useRadioButtonSingleSelect,
            })}
          >
            <TableCell colSpan={totalColumns}>{rowDetails}</TableCell>
          </TableRow>
        )}
      </Fragment>
    ) : (
      <TableExpandRow
        key={id}
        className={classnames(`${iotPrefix}--expandable-tablerow`, {
          [`${iotPrefix}--expandable-tablerow--parent`]:
            hasRowNesting && hasRowNesting?.hasSingleNestedHierarchy && nestingChildCount > 0,
          [`${iotPrefix}--expandable-tablerow--childless`]:
            hasRowNesting && nestingChildCount === 0,
          [`${iotPrefix}--expandable-tablerow--indented`]: parseInt(nestingOffset, 10) > 0,
          [`${iotPrefix}--expandable-tablerow--singly-selected`]:
            hasRowSelection === 'single' && isSelected && !useRadioButtonSingleSelect,
          [`${iotPrefix}--expandable-tablerow--last-child`]: isLastChild,
        })}
        data-row-nesting={hasRowNesting}
        data-child-count={nestingChildCount}
        data-nesting-offset={nestingOffset}
        ariaLabel={clickToExpandAria}
        expandIconDescription={clickToExpandAria}
        isExpanded={false}
        isSelected={isSelected}
        hasRowSelection={hasRowSelection}
        onExpand={(evt) => stopPropagationAndCallback(evt, onRowExpanded, id, true)}
        onClick={() => {
          if (shouldExpandOnRowClick && ((hasRowNesting && nestingChildCount) || hasRowExpansion)) {
            onRowExpanded(id, true);
          }

          if (hasRowSelection === 'single' && isSelectable !== false) {
            onRowSelected(id, true);
          }
          if (isSelectable !== false) {
            onRowClicked(id);
          }
        }}
        style={{
          '--row-nesting-offset': `${nestingOffset}px`,
        }}
      >
        {tableCells}
      </TableExpandRow>
    )
  ) : hasRowSelection === 'single' && isSelected ? (
    <TableRow
      className={classnames(`${iotPrefix}--table__row`, {
        [`${iotPrefix}--table__row--singly-selected`]: isSelected && !useRadioButtonSingleSelect,
      })}
      key={id}
      onClick={() => {
        if (isSelectable !== false) {
          onRowClicked(id);
          onRowSelected(id, !isSelected);
        }
      }}
    >
      {tableCells}
    </TableRow>
  ) : (
    <TableRow
      className={classnames(`${iotPrefix}--table__row`, {
        [`${iotPrefix}--table__row--unselectable`]: isSelectable === false,
        [`${iotPrefix}--table__row--selectable`]: isSelectable !== false,
        [`${iotPrefix}--table__row--editing`]: isEditMode,
        [`${iotPrefix}--table__row--selected`]: isSelected,
      })}
      key={id}
      onClick={() => {
        if (isSelectable !== false) {
          if (hasRowSelection === 'single') {
            onRowSelected(id, true);
          }
          onRowClicked(id);
        }
      }}
    >
      {tableCells}
    </TableRow>
  );
};

TableBodyRow.propTypes = propTypes;
TableBodyRow.defaultProps = defaultProps;

export default TableBodyRow;
