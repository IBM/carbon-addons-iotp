import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Table } from 'carbon-components-angular';

/**
 * AI PAL table component
 *
 * Example:
 * ```
 * <ai-table></ai-table>
 * ```
 */
@Component({
  selector: 'ai-table',
  template: `
    <table
      ibmTable
      [sortable]="true"
      [size]="size"
      [striped]="striped"
      [skeleton]="skeleton"
      [ngClass]="{ 'bx--data-table--sticky-header': stickyHeader }"
      class="iot-table"
    >
      <thead
        aiTableHead
        (deselectAll)="onDeselectAll()"
        (selectAll)="onSelectAll()"
        (sort)="sort.emit($event)"
        [checkboxHeaderLabel]="getCheckboxHeaderLabel()"
        [filterTitle]="getFilterTitle()"
        [model]="model"
        [size]="size"
        [selectAllCheckbox]="selectAllCheckbox"
        [selectAllCheckboxSomeSelected]="selectAllCheckboxSomeSelected"
        [showSelectionColumn]="showSelectionColumn"
        [skeleton]="skeleton"
        [sortAscendingLabel]="sortAscendingLabel"
        [sortDescendingLabel]="sortDescendingLabel"
        [stickyHeader]="stickyHeader"
      ></thead>
      <tbody
        aiTableBody
        (deselectRow)="onSelectRow($event)"
        (rowClick)="onRowClick($event)"
        (scroll)="onScroll($event)"
        (selectRow)="onSelectRow($event)"
        [checkboxRowLabel]="getCheckboxRowLabel()"
        [enableSingleSelect]="enableSingleSelect"
        [expandButtonAriaLabel]="expandButtonAriaLabel"
        [model]="model"
        [size]="size"
        [ngStyle]="{ 'overflow-y': 'scroll' }"
        [selectionLabelColumn]="selectionLabelColumn"
        [showSelectionColumn]="showSelectionColumn"
        [skeleton]="skeleton"
        *ngIf="model.totalDataLength; else noDataTemplate"
      ></tbody>
      <ng-template #noDataTemplate>
        <tbody>
          <tr class="iot--empty-table--table-row">
            <td colspan="100%">
              <div class="empty-table-cell--default">
                <ng-content></ng-content>
              </div>
            </td>
          </tr>
        </tbody>
      </ng-template>
      <tfoot>
        <ng-template [ngTemplateOutlet]="footerTemplate"> </ng-template>
        <tr *ngIf="this.model.isLoading">
          <td class="table_loading-indicator">
            <div class="bx--loading bx--loading--small">
              <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
                <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5" />
              </svg>
            </div>
          </td>
        </tr>
        <tr *ngIf="this.model.isEnd">
          <td class="table_end-indicator">
            <h5>{{ getEndOfDataText() | async }}</h5>
            <button (click)="scrollToTop($event)" class="btn--secondary-sm">
              {{ getScrollTopText() | async }}
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class AITableComponent extends Table {
  @Input() model: any;
}
