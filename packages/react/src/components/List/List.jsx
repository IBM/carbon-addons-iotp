import React, { forwardRef, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { memoize } from 'lodash-es';

import { settings } from '../../constants/Settings';
import SimplePagination, { SimplePaginationPropTypes } from '../SimplePagination/SimplePagination';
import { EditingStyle, DragAndDrop } from '../../utils/DragAndDropUtils';
import { OverridePropTypes } from '../../constants/SharedPropTypes';
import useDataLoader from '../../hooks/useDataLoader';

import DefaultListHeader from './ListHeader/ListHeader';
import DefaultListContent from './ListContent/ListContent';
import VirtualListContent from './VirtualListContent/VirtualListContent';
import { ListItemPropTypes } from './ListPropTypes';

const { iotPrefix } = settings;

const propTypes = {
  /** Specify an optional className to be applied to the container */
  className: PropTypes.string,
  /** list title */
  title: PropTypes.string,
  /** search bar call back function and search value */
  search: PropTypes.shape({
    onChange: PropTypes.func,
    value: PropTypes.string,
    id: PropTypes.string,
  }),
  /** action buttons on right side of list title */
  buttons: PropTypes.arrayOf(PropTypes.node),
  /** Node to override the default header or content */
  overrides: PropTypes.shape({
    header: OverridePropTypes,
    content: OverridePropTypes,
  }),
  /** ids of selectable rows with indeterminate selection state */
  indeterminateIds: PropTypes.arrayOf(PropTypes.string),
  /** data source of list items */
  items: PropTypes.arrayOf(PropTypes.shape(ListItemPropTypes)),
  /** list editing style for Drag and Drop */
  editingStyle: PropTypes.oneOf([
    EditingStyle.Single,
    EditingStyle.Multiple,
    EditingStyle.SingleNesting,
    EditingStyle.MultipleNesting,
  ]),
  /** use full height in list */
  isFullHeight: PropTypes.bool,
  /** use large/fat row in list */
  isLargeRow: PropTypes.bool,
  /** optional skeleton to be rendered while loading data */
  isLoading: PropTypes.bool,
  /** true if the list should have multiple selectable rows using checkboxes */
  isCheckboxMultiSelect: PropTypes.bool,
  /** optional prop to use a virtualized version of the list instead of rendering all items */
  isVirtualList: PropTypes.bool,
  /** icon can be left or right side of list row primary value */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** i18n strings */
  i18n: PropTypes.shape({
    searchPlaceHolderText: PropTypes.string,
    clearSearchIconDescription: PropTypes.string,
    expand: PropTypes.string,
    close: PropTypes.string,
    loadMore: PropTypes.string,
  }),
  /** the ids of locked items that cannot be reordered */
  lockedIds: PropTypes.arrayOf(PropTypes.string),
  /** Multiple currently selected items */
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  /** pagination at the bottom of list */
  pagination: PropTypes.shape(SimplePaginationPropTypes),
  /** ids of row expanded */
  expandedIds: PropTypes.arrayOf(PropTypes.string),
  /** callback used to limit which items that should get drop targets rendered.
   * Receives the id of the item that is being dragged and should return a list of allowed ids.
   * Returning an empty list will result in 0 drop targets but returning null will
   * enable all items as drop targets */
  getAllowedDropIds: PropTypes.func,
  /** call back function of select */
  handleSelect: PropTypes.func,
  /** call back function of expansion */
  toggleExpansion: PropTypes.func,
  /** callback function for reorder */
  onItemMoved: PropTypes.func,
  /** callback function when reorder will occur - can cancel the move by returning false */
  itemWillMove: PropTypes.func,
  /** content shown if list is empty */
  emptyState: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  testId: PropTypes.string,
  /** call back function for when load more row is clicked  (rowId) => {} */
  handleLoadMore: PropTypes.func,
  /** RowIds for rows currently loading more child rows */
  loadingMoreIds: PropTypes.arrayOf(PropTypes.string),
  /** does this list use infinite scrolling */
  isInfiniteScroll: PropTypes.bool,
  /** callback to fire when the last element in an infinite scroll list is visible */
  onInfiniteScroll: PropTypes.func,
  /** is the application currently loading more infinite data */
  isInfiniteLoading: PropTypes.bool,
  /** callback function that manages dynamically loading all data */
  onLoadData: PropTypes.func,
};

const defaultProps = {
  className: null,
  title: null,
  search: null,
  buttons: [],
  editingStyle: null,
  getAllowedDropIds: null,
  overrides: null,
  indeterminateIds: [],
  isFullHeight: false,
  isLargeRow: false,
  isLoading: false,
  isCheckboxMultiSelect: false,
  isVirtualList: false,
  i18n: {
    searchPlaceHolderText: 'Enter a value',
    expand: 'Expand',
    close: 'Close',
    loadMore: 'Load more...',
  },
  iconPosition: 'left',
  lockedIds: [],
  pagination: null,
  selectedIds: [],
  expandedIds: [],
  loadingMoreIds: [],
  items: [],
  handleSelect: () => {},
  toggleExpansion: () => {},
  onItemMoved: () => {},
  itemWillMove: () => {
    return true;
  },
  emptyState: 'No list items to show',
  testId: 'list',
  handleLoadMore: () => {},
  isInfiniteScroll: false,
  onInfiniteScroll: undefined,
  isInfiniteLoading: false,
  onLoadData: undefined,
};

const List = forwardRef((props, ref) => {
  // Destructuring this way is needed to retain the propTypes and defaultProps
  const {
    className,
    title,
    search,
    buttons,
    items: itemsProp,
    isFullHeight,
    i18n,
    lockedIds,
    pagination: paginationProp,
    selectedIds,
    expandedIds,
    getAllowedDropIds,
    handleSelect,
    overrides,
    toggleExpansion,
    iconPosition,
    editingStyle,
    indeterminateIds,
    isLargeRow,
    isLoading: isLoadingProp,
    isCheckboxMultiSelect,
    isVirtualList,
    onItemMoved,
    itemWillMove,
    emptyState,
    testId,
    handleLoadMore,
    loadingMoreIds,
    isInfiniteScroll,
    onInfiniteScroll,
    isInfiniteLoading,
    onLoadData,
  } = props;
  const mergedI18n = useMemo(() => ({ ...defaultProps.i18n, ...i18n }), [i18n]);
  const ListHeader = overrides?.header?.component || DefaultListHeader;
  const ListContent =
    overrides?.content?.component || isVirtualList ? VirtualListContent : DefaultListContent;
  // getAllowedDropIds will be called by all list items when a drag is initiated and the
  // parameter (id of the dragged item) will be the same until a new drag starts.
  const memoizedGetAllowedDropIds = getAllowedDropIds ? memoize(getAllowedDropIds) : null;
  const listRef = useRef(null);
  const dataLoaderResults = useDataLoader({
    data: itemsProp,
    onLoadData,
    pageSize: paginationProp?.pageSize || 25,
    start: itemsProp?.length ?? 0,
    pagination: paginationProp,
  });
  const pagination = dataLoaderResults?.pagination ?? paginationProp;
  const items = dataLoaderResults?.data ?? itemsProp;
  const hasMoreData = dataLoaderResults?.hasMoreData ?? false;
  const isLoadingMore = dataLoaderResults?.isLoading;
  return (
    <DragAndDrop>
      <div
        ref={listRef}
        data-testid={testId}
        className={classnames(`${iotPrefix}--list`, className, {
          [`${iotPrefix}--list__full-height`]: isFullHeight,
          [`${iotPrefix}--list--virtual`]: isVirtualList,
        })}
      >
        <ListHeader
          className={classnames(`${iotPrefix}--list--header`, overrides?.header?.props?.className)}
          title={title}
          buttons={buttons}
          search={search}
          i18n={mergedI18n}
          testId={`${testId}-header`}
          {...overrides?.header?.props}
        />
        <ListContent
          emptyState={emptyState}
          items={items}
          isFullHeight={isFullHeight}
          testId={testId}
          indeterminateIds={indeterminateIds}
          isLoading={isLoadingProp || (!items?.length && isLoadingMore)}
          isCheckboxMultiSelect={isCheckboxMultiSelect}
          selectedIds={selectedIds}
          expandedIds={expandedIds}
          getAllowedDropIds={memoizedGetAllowedDropIds}
          handleSelect={handleSelect}
          toggleExpansion={toggleExpansion}
          iconPosition={iconPosition}
          editingStyle={editingStyle}
          isLargeRow={isLargeRow}
          onItemMoved={onItemMoved}
          itemWillMove={itemWillMove}
          handleLoadMore={handleLoadMore}
          loadingMoreIds={loadingMoreIds}
          selectedItemRef={ref}
          i18n={mergedI18n}
          lockedIds={lockedIds}
          isInfiniteScroll={isInfiniteScroll}
          onInfiniteScroll={onInfiniteScroll}
          isInfiniteLoading={isInfiniteLoading}
          hasMoreData={hasMoreData}
          isLoadingMoreData={isLoadingMore}
          onLoadData={dataLoaderResults?.onLoad}
          listRef={listRef}
          {...overrides?.content?.props}
        />
        {pagination && !isLoadingProp ? (
          <div className={`${iotPrefix}--list--page`}>
            <SimplePagination {...pagination} />
          </div>
        ) : null}
      </div>
    </DragAndDrop>
  );
});

List.propTypes = propTypes;
List.defaultProps = defaultProps;

export { List as UnconnectedList };
export default List;
