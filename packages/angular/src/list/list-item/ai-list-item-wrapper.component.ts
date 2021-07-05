import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectionType } from '../ai-list.component';

@Component({
  selector: 'ai-list-item-wrapper',
  template: `
    <div class="iot--list-item-parent">
      <div
        *ngIf="draggable; else listItem"
        class="iot--list-item-editable--drag-container"
        role="listitem"
        [draggable]="true"
        (dragstart)="dragStart.emit()"
        (dragend)="dragEnd.emit()"
        (dragover)="onDragOver($event)"
      >
        <div class="iot--list-item-editable--drop-targets" *ngIf="isDragging">
          <div
            aiListTarget
            targetPosition="nested"
            (dropping)="droppedNested.emit()"
            [targetSize]="100"
          ></div>
          <div aiListTarget targetPosition="above" (dropping)="droppedAbove.emit()"></div>
          <div aiListTarget targetPosition="below" (dropping)="droppedBelow.emit()"></div>
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

  @Input() selectionType: SelectionType;

  @Output() dragStart = new EventEmitter<any>();

  @Output() dragEnd = new EventEmitter<any>();

  @Output() droppedBelow = new EventEmitter<any>();

  @Output() droppedAbove = new EventEmitter<any>();

  @Output() droppedNested = new EventEmitter<any>();

  onDragOver(ev: any) {
    ev.preventDefault();
  }
}
