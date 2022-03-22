import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'ai-empty-state',
  template: `
    <div class="iot--empty-state">
      <div class="iot--empty-state--content">
        <ng-container *ngIf="icon !== 'no-icon'">
          <ng-container *ngIf="isTemplate(icon)" [ngTemplateOutlet]="$any(icon)"></ng-container>
          <ng-container *ngIf="!isTemplate(icon)" [ngSwitch]="icon">
            <empty-state-no-results-icon
              *ngSwitchCase="'no-results'"
              iconClass="iot--empty-state--icon"
            >
            </empty-state-no-results-icon>
            <empty-state-404-icon *ngSwitchCase="'error404'" iconClass="iot--empty-state--icon">
            </empty-state-404-icon>
            <empty-state-not-authorized-icon
              *ngSwitchCase="'not-authorized'"
              iconClass="iot--empty-state--icon"
            >
            </empty-state-not-authorized-icon>
            <empty-state-success-icon *ngSwitchCase="'success'" iconClass="iot--empty-state--icon">
            </empty-state-success-icon>
            <empty-state-error-icon *ngSwitchCase="'error'" iconClass="iot--empty-state--icon">
            </empty-state-error-icon>
            <empty-state-default-icon *ngSwitchDefault iconClass="iot--empty-state--icon">
            </empty-state-default-icon>
          </ng-container>
        </ng-container>
        <ng-content select="[aiEmptyStateTitle]"></ng-content>
        <ng-content select="[aiEmptyStateBody]"></ng-content>
        <ng-content select="ai-empty-state-action"></ng-content>
        <ng-content select="ai-empty-state-secondary-action"></ng-content>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon:
    | 'default'
    | 'error'
    | 'error404'
    | 'not-authorized'
    | 'no-results'
    | 'success'
    | 'no-icon'
    | TemplateRef<any>;

  public isTemplate(value: any) {
    return value instanceof TemplateRef;
  }
}
