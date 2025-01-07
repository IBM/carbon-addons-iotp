import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SelectionType } from '../ai-list.component';
import { AIListItem } from './ai-list-item.class';
import { ChevronUp16, Draggable16 } from '@carbon/icons';
import { IconService } from 'carbon-components-angular';

@Component({
  selector: 'ai-list-item',
  template: `
    <div
      role="button"
      [attr.tabindex]="
        this.item.isSelectable && !this.item.disabled && !this.item.isDraggable ? 0 : undefined
      "
      class="iot--list-item"
      [ngClass]="{
        'iot--list-item__selectable': item.isSelectable,
        'iot--list-item__selected': item.selected,
        'iot--list-item-editable': item.isDraggable,
        'iot--list-item__large': item.size === 'lg'
      }"
      (click)="selectionType === 'single' ? handleSelect(!item.selected) : null"
      (keyup.Space)="selectionType === 'single' ? handleSelect(!item.selected) : null"
    >
      <div class="iot--list-item-editable--drag-preview">
        {{ item.value }}
      </div>
      <svg
        *ngIf="draggable && item.isDraggable"
        class="iot--list-item--handle"
        [ngClass]="{ 'iot--list-item--handle__disabled': item.disabled }"
        ibmIcon="draggable"
        size="16"
      ></svg>
      <div
        *ngIf="nestingLevel > 0"
        class="iot--list-item--nesting-offset"
        [ngStyle]="{ width: 30 * nestingLevel + 'px' }"
      ></div>
      <div
        *ngIf="item.hasChildren()"
        role="button"
        (click)="!item.disabled ? item.expand(!item.expanded) : undefined"
        (keyup.Space)="!item.disabled ? item.expand(!item.expanded) : undefined"
        [tabindex]="!item.disabled ? 0 : undefined"
        class="iot--list-item--expand-icon"
        [ngClass]="{ 'iot--list-item--expand-icon__disabled': item.disabled }"
      >
        <svg *ngIf="!item.expanded" ibmIcon="chevron--down" size="16"></svg>
        <svg *ngIf="item.expanded" ibmIcon="chevron--up" size="16"></svg>
      </div>
      <div
        class="iot--list-item--content"
        [ngClass]="{
          'iot--list-item--content__selected': item.selected,
          'iot--list-item--content__large': item.size === 'lg'
        }"
      >
        <div
          *ngIf="item.isSelectable && selectionType === 'multi'"
          class="iot--list-item--content--icon iot--list-item--content--icon__left"
        >
          <ibm-checkbox
            (checkedChange)="handleSelect($event)"
            [checked]="item.selected"
            [id]="item.id + '_checkbox'"
            [disabled]="item.disabled"
            [indeterminate]="item.indeterminate"
          >
          </ibm-checkbox>
        </div>
        <div
          class="iot--list-item--content--values"
          [ngClass]="{ 'iot--list-item--content--values__large': item.size === 'lg' }"
        >
          <div
            class="iot--list-item--content--values--main"
            [ngClass]="{ 'iot--list-item--content--values--main__large': item.size === 'lg' }"
          >
            <div
              title="{{ item.value }}"
              class="iot--list-item--content--values--value"
              [ngClass]="{
                'iot--list-item--category': item.isCategory,
                'iot--list-item--content--values__disabled': item.disabled,
                'iot--list-item--content--values--value__with-actions': item.rowActions
              }"
            >
              {{ item.value }}
            </div>
            <div
              *ngIf="item.secondaryValue !== undefined"
              class="iot--list-item--content--values--value"
              [ngClass]="{
                'iot--list-item--content--values__disabled': item.disabled,
                'iot--list-item--content--values--value__large': item.size === 'lg'
              }"
            >
              {{ item.secondaryValue }}
            </div>
            <div *ngIf="item.rowActions" class="iot--list-item--content--row-actions">
              <ng-container
                [ngTemplateOutlet]="item.rowActions"
                [ngTemplateOutletContext]="item.rowActionsContext"
              >
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AIListItemComponent implements OnInit {
  @Input() item: AIListItem;
  /**
   * Nesting level of the list item. Determines the amount of space the item will be indented
   * when rendered in the list.
   */
  @Input() nestingLevel = 0;

  /**
   * Indicates whether or not the item can be dragged into a different position.
   */
  @Input() draggable = false;

  /**
   * Indicates whether or not the list item can be selected.
   */
  @Input() isSelectable = false;

  /**
   * Indicates the editing style of the list item. If it is `multi` the list item will be
   * rendered with a checkbox. If it is not given then the list item will not be editable,
   * that is, you can't select it.
   */
  @Input() selectionType: SelectionType;

  /**
   * Emitted if the item has been selected.
   */
  @Output() itemSelected = new EventEmitter<any>();

  constructor(protected iconService: IconService) {}

  ngOnInit() {
    this.iconService.register(ChevronUp16);
    this.iconService.register(Draggable16);
  }

  handleSelect(select: boolean) {
    this.item.select(select);
    this.itemSelected.emit();
  }
}
