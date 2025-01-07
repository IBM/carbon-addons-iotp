import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ai-list-item-wrapper',
  template: `
    <div data-floating-menu-container="true" class="iot--list-item-parent">
      <div
        *ngIf="draggable && !disabled; else listItem"
        class="iot--list-item-editable--drag-container"
        role="listitem"
        [draggable]="true"
        (dragstart)="dragStart.emit($event)"
        (dragend)="dragEnd.emit($event)"
      >
        <div
          class="iot--list-item-editable--drop-targets"
          [ngClass]="{ 'iot--list-item__large': size === 'lg' }"
          *ngIf="isDragging"
        >
          <div
            aiListTarget
            targetPosition="nested"
            (dropping)="droppedNested.emit($event)"
            (dragEnter)="dragEnterNested.emit($event)"
            (dragOver)="dragOverNested.emit($event)"
            [targetSize]="100"
          ></div>
          <div
            aiListTarget
            targetPosition="above"
            (dropping)="droppedAbove.emit($event)"
            (dragEnter)="dragEnterAbove.emit($event)"
            (dragOver)="dragOverAbove.emit($event)"
          ></div>
          <div
            aiListTarget
            targetPosition="below"
            (dropping)="droppedBelow.emit($event)"
            (dragEnter)="dragEnterBelow.emit($event)"
            (dragOver)="dragOverBelow.emit($event)"
          ></div>
        </div>
        <ng-container [ngTemplateOutlet]="listItem"></ng-container>
      </div>
    </div>

    <ng-template #listItem>
      <ng-content></ng-content>
    </ng-template>
  `,
})
export class AIListItemWrapperComponent {
  /**
   * Indicates whether or not the item can be dragged into a different position.
   */
  @Input() draggable = false;

  @Input() isDragging = false;

  /**
   * Indicates whether or not the list item can be selected.
   */
  @Input() isSelectable = false;

  @Input() size: 'md' | 'lg' = 'md';

  @Input() disabled = false;

  @Output() dragStart = new EventEmitter<any>();

  @Output() dragEnd = new EventEmitter<any>();

  @Output() dragEnterAbove = new EventEmitter<any>();

  @Output() dragOverAbove = new EventEmitter<any>();

  @Output() dragEnterBelow = new EventEmitter<any>();

  @Output() dragOverBelow = new EventEmitter<any>();

  @Output() dragEnterNested = new EventEmitter<any>();

  @Output() dragOverNested = new EventEmitter<any>();

  @Output() droppedBelow = new EventEmitter<any>();

  @Output() droppedAbove = new EventEmitter<any>();

  @Output() droppedNested = new EventEmitter<any>();
}
