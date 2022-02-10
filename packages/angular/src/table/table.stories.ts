import { boolean, select, text, withKnobs } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { moduleMetadata, storiesOf } from '@storybook/angular';
import { ButtonModule, TableItem } from 'carbon-components-angular';

import { AITableHeaderItem, AITableModel } from './table-model.class';
import { AITableModule } from './table.module';

import { EmptyStateModule } from '../empty-state-index';

const simpleModel = new AITableModel();
const simpleMultiHeaderModel = new AITableModel();
const emptyDataModel = new AITableModel();

simpleModel.setHeader([
  [
    new AITableHeaderItem({ data: 'hwer1', alignment: 'center' }),
    new AITableHeaderItem({ data: 'hwer2', alignment: 'center' }),
    new AITableHeaderItem({ data: 'hwer3', alignment: 'center' }),
    new AITableHeaderItem({ data: 'hwer4', alignment: 'center' }),
  ],
]);

simpleModel.setData([
  [
    new TableItem({ data: 'Name 1' }),
    new TableItem({ data: 'qwer' }),
    new TableItem({ data: 'qwer1' }),
    new TableItem({ data: 'qwer2' }),
  ],
  [
    new TableItem({ data: 'Name 3' }),
    new TableItem({ data: 'zwer' }),
    new TableItem({ data: 'qwer' }),
    new TableItem({ data: 'qwer2' }),
  ],
  [
    new TableItem({ data: 'Name 2' }),
    new TableItem({ data: 'swer' }),
    new TableItem({ data: 'swer1' }),
    new TableItem({ data: 'qwer2' }),
  ],
  [
    new TableItem({ data: 'Name 4' }),
    new TableItem({ data: 'twer' }),
    new TableItem({ data: 'twer1' }),
    new TableItem({ data: 'qwer2' }),
  ],
]);

simpleMultiHeaderModel.setHeader([
  [
    new AITableHeaderItem({
      data: 'Name',
      rowSpan: 2,
    }),
    new AITableHeaderItem({ data: 'hwer', colSpan: 2, sortable: false }),
  ],
  [new AITableHeaderItem({ data: 'hwer1' }), new AITableHeaderItem({ data: 'hwer2' })],
]);

simpleMultiHeaderModel.setData([
  [
    new TableItem({ data: 'Name 1' }),
    new TableItem({ data: 'qwer' }),
    new TableItem({ data: 'qwer1' }),
  ],
  [new TableItem({ data: 'Name 3' }), new TableItem({ data: 'zwer', colSpan: 2 }), null],
  [
    new TableItem({ data: 'Name 2' }),
    new TableItem({ data: 'swer' }),
    new TableItem({ data: 'swer1' }),
  ],
  [
    new TableItem({ data: 'Name 4' }),
    new TableItem({ data: 'twer' }),
    new TableItem({ data: 'twer1' }),
  ],
]);

emptyDataModel.setHeader([
  [
    new AITableHeaderItem({
      data: 'Name',
    }),
    new AITableHeaderItem({
      data: 'Name 2',
    }),
    new AITableHeaderItem({
      data: 'Name 3',
    }),
    new AITableHeaderItem({
      data: 'Name 4',
    }),
  ],
]);

storiesOf('Components/Table', module)
  .addDecorator(
    moduleMetadata({
      imports: [AITableModule, ButtonModule, EmptyStateModule],
    })
  )
  .addDecorator(withKnobs)
  .add('Basic', () => {
    return {
      template: `
			<ai-table
				[model]="model"
				[size]="size"
				[showSelectionColumn]="showSelectionColumn"
				[striped]="striped"
				[skeleton]="skeleton"
				[isDataGrid]="isDataGrid"
				(sort)="customSort($event)"
				(rowClick)="rowClick($event)">
			</ai-table>
		`,
      props: {
        model: simpleModel,
        size: select('size', { Small: 'sm', Short: 'sh', Normal: 'md', Large: 'lg' }, 'md'),
        showSelectionColumn: boolean('showSelectionColumn', true),
        striped: boolean('striped', true),
        isDataGrid: boolean('Data grid keyboard interactions', true),
        skeleton: boolean('Skeleton mode', false),
        rowClick: action('row clicked'),
        customSort: (index: number) => {
          if (simpleMultiHeaderModel.getClosestHeader(index).sorted) {
            // if already sorted flip sorting direction
            simpleMultiHeaderModel.getClosestHeader(
              index
            ).ascending = simpleMultiHeaderModel.getClosestHeader(index).descending;
          }
          simpleMultiHeaderModel.sort(index);
        },
      },
    };
  })
  .add('Basic multiheader', () => {
    return {
      template: `
			<ai-table
				[model]="model"
				[size]="size"
				[showSelectionColumn]="showSelectionColumn"
				[striped]="striped"
				[skeleton]="skeleton"
				[isDataGrid]="isDataGrid"
				(sort)="customSort($event)"
				(rowClick)="rowClick($event)">
			</ai-table>
		`,
      props: {
        model: simpleMultiHeaderModel,
        size: select('size', { Small: 'sm', Short: 'sh', Normal: 'md', Large: 'lg' }, 'md'),
        showSelectionColumn: boolean('showSelectionColumn', true),
        striped: boolean('striped', true),
        isDataGrid: boolean('Data grid keyboard interactions', true),
        skeleton: boolean('Skeleton mode', false),
        rowClick: action('row clicked'),
        customSort: (index: number) => {
          if (simpleMultiHeaderModel.getClosestHeader(index).sorted) {
            // if already sorted flip sorting direction
            simpleMultiHeaderModel.getClosestHeader(
              index
            ).ascending = simpleMultiHeaderModel.getClosestHeader(index).descending;
          }
          simpleMultiHeaderModel.sort(index);
        },
      },
    };
  })
  .add('Empty', () => {
    return {
      template: `
      <div class="iot--table-container bx--data-table-container">
        <div class="addons-iot-table-container">
          <div class="bx--data-table-content">
            <ai-table
              [showSelectionColumn]="false"
              [model]="model">
              <ai-empty-state [icon]="icon">
                <h3 aiEmptyStateTitle>{{ title }}</h3>
                <p aiEmptyStateBody>{{ body }}</p>
                <ai-empty-state-action>
                  <button ibmButton (click)="actionOnClick()">Create some data</button>
                </ai-empty-state-action>
              </ai-empty-state>
            </ai-table>
          </div>
        </div>
      </div>
		`,
      props: {
        model: emptyDataModel,
        icon: select(
          'icon',
          ['error', 'error404', 'not-authorized', 'no-results', 'success', 'default', 'no-icon'],
          'default'
        ),
        title: text('title', 'No data to display'),
        body: text('body', 'Optional extra sentence or sentences'),
        actionOnClick: () => {
          console.log('Action button clicked');
        },
      },
    };
  });
