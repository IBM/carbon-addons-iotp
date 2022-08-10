import { moduleMetadata } from '@storybook/angular';
import { Component } from '@angular/core';
import { IconModule, IconService } from 'carbon-components-angular';
import Popup16 from '@carbon/icons/lib/popup/16';
import Document16 from '@carbon/icons/lib/document/16';
import Bee16 from '@carbon/icons/lib/bee/16';

import { IconContentSwitcherModule } from './icon-content-switcher.module';

@Component({
  selector: 'app-demo-icons',
  template: '',
})
class AppDemoIcons {
  constructor(protected iconService: IconService) {
    iconService.registerAll([Popup16, Document16, Bee16]);
  }
}

export default {
  title: 'Components/Icon content switcher',

  decorators: [
    moduleMetadata({
      imports: [IconContentSwitcherModule, IconModule],
      declarations: [AppDemoIcons],
    })
  ],
  argTypes: {
    selected: {
      action: 'Selection changed',
      table: {
        disable: true
      }
    },
    theme: {
      control: {
        type: 'radio',
        options: [ 'dark', 'light' ]
      },
      defaultValue: 'dark'
    }
  }
};

export const basic = (args) => ({
  template: `
    <ai-content-switcher (selected)="selected($event)" [theme]="theme">
      <button aiIconContentOption name="First" [theme]="theme"><svg ibmIcon="document" size="16" class="bx--btn__icon"></svg></button>
      <button aiIconContentOption name="Second" [theme]="theme"><svg ibmIcon="bee" size="16" class="bx--btn__icon"></svg></button>
      <button aiIconContentOption name="Third" [theme]="theme"><svg ibmIcon="popup" size="16" class="bx--btn__icon"></svg></button>
    </ai-content-switcher>
    <app-demo-icons></app-demo-icons>
  `,
  props: args,
  name: 'Basic'
});
