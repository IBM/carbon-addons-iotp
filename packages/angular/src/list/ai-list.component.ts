import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { AIListItem } from './list-item/ai-list-item.class';
import { IconService } from 'carbon-components-angular';
import { Bee32 } from '@carbon/icons';

export enum SelectionType {
  SINGLE = 'single',
  MULTI = 'multi',
}

@Component({
  selector: 'ai-list',
  template: `
    <div class="iot--list" [ngClass]="{ 'iot--list__full-height': isFullHeight }">
      <ai-list-header [hasSearch]="hasSearch" [title]="title" (onSearch)="handleSearch($event)">
      </ai-list-header>
      <div
        class="iot--list--content"
        [ngClass]="{ 'iot--list--content__full-height': isFullHeight }"
      >
        <ng-container
          *ngIf="items && items.length > 0"
          [ngTemplateOutlet]="listItemTemplateRef"
          [ngTemplateOutletContext]="{
            $implicit: {
              item: items,
              nestingLevel: 0,
              parentItem: null,
              index: 0
            }
          }"
        >
        </ng-container>
        <div
          *ngIf="!items || items.length < 1"
          class="iot--list--empty-state iot--list--empty-state__full-height"
          (drop)="isDragging ? handleDrop(null, 0) : undefined"
          (dragover)="$event.preventDefault()"
        >
          <ng-container *ngIf="!isTemplate(emptyState)">
            <svg ibmIcon="bee" size="32"></svg>
            <p>{{ emptyState }}</p>
          </ng-container>
          <ng-container *ngIf="isTemplate(emptyState)" [ngTemplateOutlet]="emptyState">
          </ng-container>
        </div>
      </div>
    </div>

    <ng-template #listItemTemplateRef let-data>
      <!-- Render item -->
      <ng-container *ngIf="data.item.id && !isArray(data.item) && data.item.includes(searchString)">
        <ai-list-item-wrapper
          [draggable]="itemsDraggable && data.item.isDraggable"
          [disabled]="data.item.disabled"
          [size]="data.item.size"
          [isDragging]="isDragging"
          (dragStart)="handleDragStart(data.item)"
          (dragEnd)="handleDragEnd($event, data.item, data.parentItem)"
          (droppedAbove)="handleDrop(data.parentItem, data.index)"
          (droppedBelow)="handleDrop(data.parentItem, data.index + 1)"
          (droppedNested)="handleDrop(data.item, 0)"
          (dragEnterBelow)="handleDragOver($event, data.parentItem)"
          (dragOverBelow)="handleDragOver($event, data.parentItem)"
          (dragEnterAbove)="handleDragOver($event, data.parentItem)"
          (dragOverAbove)="handleDragOver($event, data.parentItem)"
          (dragEnterNested)="handleDragOver($event, data.item)"
          (dragOverNested)="handleDragOver($event, data.item)"
        >
          <ai-list-item
            [item]="data.item"
            [nestingLevel]="data.item.hasChildren() ? data.nestingLevel - 1 : data.nestingLevel"
            (itemSelected)="handleSelect(data.item)"
            [selectionType]="selectionType"
            [draggable]="itemsDraggable"
          >
          </ai-list-item>
        </ai-list-item-wrapper>
      </ng-container>

      <!-- Item has children -->
      <ng-container *ngIf="!isArray(data.item) && data.item.hasChildren() && data.item.expanded">
        <ng-container
          *ngFor="let item of data.item.items; index as i"
          [ngTemplateOutlet]="listItemTemplateRef"
          [ngTemplateOutletContext]="{
            $implicit: {
              item: item,
              nestingLevel: getAdjustedNestingLevel(data.item.items, data.nestingLevel),
              parentItem: data.item,
              index: i
            }
          }"
        ></ng-container>
      </ng-container>

      <!-- Top level item -->
      <ng-container *ngIf="isArray(data.item)">
        <ng-container
          *ngFor="let item of data.item; index as i"
          [ngTemplateOutlet]="listItemTemplateRef"
          [ngTemplateOutletContext]="{
            $implicit: {
              item: item,
              nestingLevel: getAdjustedNestingLevel(data.item, data.nestingLevel),
              parentItem: null,
              index: i
            }
          }"
        >
        </ng-container>
      </ng-container>
    </ng-template>
  `,
})
export class AIListComponent implements OnInit {
  @Input() items: AIListItem[];

  @Input() selectionType: SelectionType;

  /**
   * Indicates whether or not items in the list can be dragged into new positions.
   */
  @Input() itemsDraggable: boolean;

  @Input() set isDragging(isDragging: boolean) {
    let shouldEmit = false;
    if (this._isDragging !== isDragging) {
      shouldEmit = true;
    }
    this._isDragging = isDragging;
    if (shouldEmit) {
      this.isDraggingChange.emit(isDragging);
    }
  }

  get isDragging() {
    return this._isDragging;
  }

  @Input() set draggedItem(draggedItem: AIListItem) {
    let shouldEmit = false;
    if (this._draggedItem !== draggedItem) {
      shouldEmit = true;
    }
    this._draggedItem = draggedItem;
    if (shouldEmit) {
      this.draggedItemChange.emit(draggedItem);
    }
  }

  get draggedItem() {
    return this._draggedItem;
  }

  /**
   * Indicates whether a search bar should be rendered in the list header.
   */
  @Input() hasSearch = false;

  /**
   * Title to be displayed on the list header.
   */
  @Input() title: string;

  @Input() isFullHeight = false;

  /**
   * Text that is displayed when list is empty. To change the default
   * icon with the text, this can also be set to a `TemplateRef`.
   *
   * The reason we are using type `any` instead of `string | TemplateRef<any>`,
   * which is the only two types that should be accepted, is because
   * passing `emptyState` into `ngTemplateOutlet` would cause the error:
   * `Type 'string | TemplateRef<any>' is not assignable to type 'TemplateRef<any>'`
   * to come up while building.
   */
  @Input() emptyState: any = 'No list items to show';

  /**
   * If a `hasSearch` is true, this is emitted when search value is changed.
   */
  @Output() onSearch = new EventEmitter<string>();

  @Output() isDraggingChange = new EventEmitter<boolean>();
  @Output() draggedItemChange = new EventEmitter<AIListItem>();

  searchString = '';

  protected _isDragging = false;
  protected _draggedItem: AIListItem = null;

  constructor(protected iconService: IconService) {}

  ngOnInit() {
    this.iconService.register(Bee32);
  }

  handleDragStart(item: AIListItem) {
    this.isDragging = true;
    this.draggedItem = item;
  }

  handleDragEnd(dragEvent: DragEvent, item: AIListItem, parent: AIListItem) {
    const dragEffect = dragEvent.dataTransfer.dropEffect;

    // Remove the original item if the dragged item has been successfully moved to a new position.
    if (dragEffect !== 'none') {
      if (parent === null) {
        const droppedItemIndex = this.items.findIndex((listItem: AIListItem) => listItem === item);
        this.items.splice(droppedItemIndex, 1);
      } else {
        const droppedItemIndex = parent.items.findIndex(
          (listItem: AIListItem) => listItem === item
        );
        parent.items.splice(droppedItemIndex, 1);
      }
    }

    this.isDragging = false;
    this.draggedItem = null;
  }

  handleDragOver(dragEvent: DragEvent, receiver: AIListItem) {
    // Only allow dropping if:
    // 1. The dragged item is not being dropped onto one of its' own children.
    // 2. The dragged item is not being dropped onto itself.
    if (
      this.draggedItem &&
      !this.draggedItem.hasItem(receiver) &&
      (receiver === null || receiver.id !== this.draggedItem.id)
    ) {
      dragEvent.preventDefault();
    }
  }

  handleDrop(receiver: AIListItem, index: number) {
    // A copy of the dragged item is created so that the original can be removed in `handleDragEnd`.
    const item = new AIListItem(this.draggedItem);
    if (receiver === null) {
      this.items.splice(index, 0, item);
    } else {
      receiver.addItem(item, index);
    }
  }

  handleSelect(selectedItem: AIListItem) {
    if (this.selectionType === SelectionType.MULTI) {
      this.updateChildSelectedStates(selectedItem);
      this.updateParentSelectedStates(this.items);
    } else {
      this.onSingleSelect(this.items, selectedItem.id);
    }
  }

  handleSearch(searchString: string) {
    this.searchString = searchString;
    this.onSearch.emit(searchString);
  }

  /**
   * This function returns the adjusted `nestingLevel`s of an AIListItem.
   */
  getAdjustedNestingLevel(items: AIListItem[], currentDepth: number) {
    return items.some((item) => item.hasChildren()) ? currentDepth + 1 : currentDepth;
  }

  isArray(obj: any) {
    return Array.isArray(obj);
  }

  public isTemplate(value: any) {
    return value instanceof TemplateRef;
  }

  protected updateChildSelectedStates(selectedItem: AIListItem) {
    if (selectedItem.hasChildren()) {
      selectedItem.items.forEach((item: AIListItem) => {
        if (!item.disabled) {
          item.select(selectedItem.selected);
        }
        this.updateChildSelectedStates(item);
      });
    }
  }

  protected updateParentSelectedStates(items: AIListItem[]) {
    items.forEach((item: AIListItem) => {
      if (item.hasChildren()) {
        this.updateParentSelectedStates(item.items);
      } else {
        return;
      }

      if (item.isSelectable && item.allChildrenSelected()) {
        item.select();
        item.setIndeterminate(false);
      } else if (item.isSelectable && item.someChildrenSelected()) {
        item.select();
        item.setIndeterminate();
      } else {
        if (!item.items.every((listItem) => listItem.disabled)) {
          item.select(false);
        }
        item.setIndeterminate(false);
      }
    });
  }

  protected onSingleSelect(items: AIListItem[], selectedId: string) {
    items.forEach((item: AIListItem) => {
      if (item.id !== selectedId) {
        item.select(false);
      }

      if (item.hasChildren()) {
        this.onSingleSelect(item.items, selectedId);
      }
    });
  }
}
