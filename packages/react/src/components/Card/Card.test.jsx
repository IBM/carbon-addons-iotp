import { mount } from 'enzyme';
import React from 'react';
import { Tooltip } from 'carbon-components-react';
import { render, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popup16, Tree16 } from '@carbon/icons-react';

import { CARD_SIZES, CARD_TITLE_HEIGHT, CARD_ACTIONS } from '../../constants/LayoutConstants';
import { settings } from '../../constants/Settings';
import { PICKER_KINDS } from '../../constants/DateConstants';
import { DATE_PICKER_OPTIONS } from '../../constants/CardPropTypes';

import CardRangePicker from './CardRangePicker';
import Card from './Card';

const { iotPrefix } = settings;

const tooltipElement = <div>This is some other text</div>;

const cardProps = {
  title: 'My Title',
  id: 'my card',
};

describe('Card', () => {
  it('is selectable by testID or testId', () => {
    const { rerender } = render(<Card {...cardProps} size={CARD_SIZES.SMALL} testID="CARD_TEST" />);

    expect(screen.getByTestId('CARD_TEST')).toBeTruthy();
    rerender(
      <Card
        {...cardProps}
        size={CARD_SIZES.SMALL}
        availableActions={{ range: true, expand: true }}
        testId="card_test"
      />
    );
    expect(screen.getByTestId('card_test')).toBeTruthy();
    expect(screen.getByTestId('card_test-content')).toBeTruthy();
    expect(screen.getByTestId('card_test-title')).toBeTruthy();
    expect(screen.getByTestId('card_test-header')).toBeTruthy();
    expect(screen.getByTestId('card_test-toolbar')).toBeTruthy();
    expect(screen.getByTestId('card_test-toolbar-expand-button')).toBeTruthy();
    expect(screen.getByTestId('card_test-toolbar-range-picker')).toBeTruthy();
  });

  it('small', () => {
    const wrapper = mount(<Card {...cardProps} size={CARD_SIZES.SMALL} />);

    // small should have full header
    expect(wrapper.find(`.${iotPrefix}--card--header`)).toHaveLength(1);
  });

  it('child size prop', () => {
    const childRenderInTitleCard = jest.fn();

    mount(
      <Card title="My Title" size={CARD_SIZES.MEDIUM}>
        {childRenderInTitleCard}
      </Card>
    );
    expect(childRenderInTitleCard).toHaveBeenCalledWith(
      {
        width: 0,
        height: -CARD_TITLE_HEIGHT,
        position: null,
      },
      expect.anything()
    );

    const childRenderInNoTitleCard = jest.fn();

    mount(<Card size={CARD_SIZES.MEDIUM}>{childRenderInNoTitleCard}</Card>);
    expect(childRenderInNoTitleCard).toHaveBeenCalledWith(
      {
        width: 0,
        height: 0,
        position: null,
      },
      expect.anything()
    );
  });

  it('render icons', () => {
    let wrapper = mount(
      <Card {...cardProps} size={CARD_SIZES.SMALL} availableActions={{ range: true }} />
    );
    // should render CardRangePicker if isEditable is false
    expect(wrapper.find(CardRangePicker)).toHaveLength(1);

    wrapper = mount(
      <Card
        {...cardProps}
        size={CARD_SIZES.SMALL}
        availableActions={{ range: true, expand: true }}
      />
    );

    // should render CardRangePicker and Expand
    expect(wrapper.find(CardRangePicker)).toHaveLength(1);
    expect(wrapper.find(Popup16)).toHaveLength(1);

    wrapper = mount(
      <Card {...cardProps} size={CARD_SIZES.SMALL} isEditable availableActions={{ range: true }} />
    );
    // CardRangePicker icon should not render if isEditable prop is true
    expect(wrapper.find(CardRangePicker)).toHaveLength(0);
  });

  it('render custom icons', () => {
    render(
      <Card
        {...cardProps}
        size={CARD_SIZES.SMALL}
        availableActions={{ range: true, expand: true }}
        renderExpandIcon={Tree16}
      />
    );

    const button = screen.queryByLabelText('Expand to fullscreen');

    const { container } = render(<Tree16 aria-hidden="true" aria-label="Expand to fullscreen" />);

    expect(button.firstChild).toEqual(container.firstChild.firstChild);
  });

  it('additional prop based elements', () => {
    let wrapper = mount(<Card {...cardProps} size={CARD_SIZES.LARGE} tooltip={tooltipElement} />);
    // tooltip prop will render a tooltip in the header
    expect(wrapper.find(`.${iotPrefix}--card--header`).find(Tooltip)).toHaveLength(1);
    // without the isLoading prop SkeletonWrapper should not be rendered
    expect(wrapper.find(`.${iotPrefix}--card--skeleton-wrapper`)).toHaveLength(0);
    // with the isLoading prop SkeletonWrapper should  be rendered
    wrapper = mount(
      <Card {...cardProps} isLoading size={CARD_SIZES.SMALLWIDE} tooltip={tooltipElement} />
    );
    expect(wrapper.find(`.${iotPrefix}--card--skeleton-wrapper`)).toHaveLength(1);
  });
  it('isExpanded', () => {
    const wrapper = mount(
      <Card {...cardProps} isExpanded size={CARD_SIZES.LARGE} tooltip={tooltipElement} />
    );
    // isExpanded renders the modal wrapper around it
    expect(wrapper.find('.bx--modal')).toHaveLength(1);
  });
  it('card actions for expand/collapse', () => {
    const mockOnCardAction = jest.fn();
    const wrapper = mount(
      <Card
        {...cardProps}
        isExpanded
        size={CARD_SIZES.LARGE}
        tooltip={tooltipElement}
        onCardAction={mockOnCardAction}
        availableActions={{ expand: true }}
      />
    );
    wrapper.find(`.${iotPrefix}--card--toolbar-svg-wrapper`).get(0).props.onClick();
    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.CLOSE_EXPANDED_CARD);

    mockOnCardAction.mockClear();
    const wrapper2 = mount(
      <Card
        {...cardProps}
        size={CARD_SIZES.LARGE}
        tooltip={tooltipElement}
        onCardAction={mockOnCardAction}
        availableActions={{ expand: true }}
      />
    );
    wrapper2.find(`.${iotPrefix}--card--toolbar-svg-wrapper`).get(0).props.onClick();
    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.OPEN_EXPANDED_CARD);
  });
  it('card editable actions', async () => {
    const mockOnCardAction = jest.fn();
    render(
      <Card
        {...cardProps}
        isEditable
        size={CARD_SIZES.LARGE}
        tooltip={tooltipElement}
        onCardAction={mockOnCardAction}
        availableActions={{ edit: true, clone: true, delete: true }}
      />
    );
    fireEvent.click(screen.getAllByTitle('Open and close list of options')[0]);
    const secondElement = await screen.findByText('Clone card');
    fireEvent.click(secondElement);
    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.CLONE_CARD);

    // Reopen menu
    fireEvent.click(screen.getAllByTitle('Open and close list of options')[0]);
    mockOnCardAction.mockClear();
    const thirdElement = await screen.findByText('Delete card');
    fireEvent.click(thirdElement);
    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.DELETE_CARD);
  });
  it('card actions for default range picker', () => {
    const mockOnCardAction = jest.fn();
    render(
      <Card
        {...cardProps}
        isExpanded
        size={CARD_SIZES.LARGE}
        tooltip={tooltipElement}
        onCardAction={mockOnCardAction}
        availableActions={{ expand: true, range: true }}
      />
    );
    // pop out the calendar
    userEvent.click(screen.getAllByTitle(`Select time range`)[0]);

    // select a default range
    userEvent.click(screen.getByText(`Last 24 hrs`));

    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.CHANGE_TIME_RANGE, {
      range: 'last24Hours',
    });
  });
  it('card actions for dateTime range picker', () => {
    const mockOnCardAction = jest.fn();
    render(
      <Card
        {...cardProps}
        isExpanded
        size={CARD_SIZES.LARGE}
        tooltip={tooltipElement}
        onCardAction={mockOnCardAction}
        availableActions={{ expand: true, range: DATE_PICKER_OPTIONS.FULL }}
      />
    );
    // pop out the calendar
    userEvent.click(screen.getAllByLabelText(`Calendar`)[0]);

    const hourLabel = 'Last 24 hours';

    // select a default range
    userEvent.click(screen.getByText(hourLabel));

    // apply the default range
    userEvent.click(screen.getByText('Apply'));

    expect(mockOnCardAction).toHaveBeenCalledWith(cardProps.id, CARD_ACTIONS.CHANGE_TIME_RANGE, {
      timeRangeKind: PICKER_KINDS.PRESET,
      timeRangeValue: { id: 'item-05', label: hourLabel, offset: 24 * 60 },
    });
  });
  it('card toolbar renders in header only when there are actions', () => {
    const wrapperWithActions = mount(
      <Card {...cardProps} isExpanded size={CARD_SIZES.SMALL} availableActions={{ expand: true }} />
    );
    expect(
      wrapperWithActions
        .getDOMNode()
        .querySelectorAll(`.${iotPrefix}--card--header .${iotPrefix}--card--toolbar`)
    ).toHaveLength(1);

    const wrapperWithoutActions = mount(<Card {...cardProps} isExpanded size={CARD_SIZES.SMALL} />);
    expect(
      wrapperWithoutActions
        .getDOMNode()
        .querySelectorAll(`.${iotPrefix}--card--header .${iotPrefix}--card--toolbar`)
    ).toHaveLength(0);
  });
});
