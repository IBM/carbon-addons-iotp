import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

import { settings } from '../../../constants/Settings';

import TableCellRenderer from './TableCellRenderer';

const { iotPrefix, prefix } = settings;

describe('TableCellRenderer', () => {
  const cellText = 'This text is not actually measured';
  const textTruncateClassName = `${iotPrefix}--table__cell-text--truncate`;
  const textNoWrapClassName = `${iotPrefix}--table__cell-text--no-wrap`;

  const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');

  const setOffsetWidth = (width) => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      writable: false,
      configurable: true,
      value: width,
    });
  };

  const setScrollWidth = (width) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      writable: false,
      configurable: true,
      value: width,
    });
  };

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
  });

  it('truncates only for cellTextOverflow:"truncate"', () => {
    const { rerender } = render(
      <TableCellRenderer cellTextOverflow="truncate">{cellText}</TableCellRenderer>
    );
    expect(screen.getByText(cellText)).toHaveClass(textTruncateClassName);

    rerender(<TableCellRenderer>{cellText}</TableCellRenderer>);
    expect(screen.getByText(cellText)).not.toHaveClass(textTruncateClassName);
  });

  it('does not allow wrapping for cellTextOverflow:"grow"', () => {
    render(<TableCellRenderer cellTextOverflow="grow">{cellText}</TableCellRenderer>);
    expect(screen.getByText(cellText)).toHaveClass(textNoWrapClassName);
  });

  it('allows wrapping by default', () => {
    render(<TableCellRenderer>{cellText}</TableCellRenderer>);
    expect(screen.getByText(cellText)).not.toHaveClass(textNoWrapClassName);
    expect(screen.getByText(cellText)).not.toHaveClass(textTruncateClassName);
  });

  it('allows wrapping for cellTextOverflow:"wrap" ', () => {
    render(<TableCellRenderer cellTextOverflow="wrap">{cellText}</TableCellRenderer>);
    // Wrapping is Carbon default, so the the absense of these classes
    // indicates that the text is wrapping.
    expect(screen.getByText(cellText)).not.toHaveClass(textNoWrapClassName);
    expect(screen.getByText(cellText)).not.toHaveClass(textTruncateClassName);
  });

  it('only truncates children that are strings, numbers or booleans', () => {
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <TableCellRenderer cellTextOverflow="truncate">my string</TableCellRenderer>
            </td>
            <td>
              <TableCellRenderer cellTextOverflow="truncate">{true}</TableCellRenderer>
            </td>
            <td>
              <TableCellRenderer cellTextOverflow="truncate">{127}</TableCellRenderer>
            </td>
            <td>
              <TableCellRenderer cellTextOverflow="truncate">
                <div>a div</div>
              </TableCellRenderer>
            </td>
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByText('my string')).toHaveClass(textTruncateClassName);
    expect(screen.getByText('true')).toHaveClass(textTruncateClassName);
    expect(screen.getByText('127')).toHaveClass(textTruncateClassName);
    expect(screen.getByText('a div').parentNode).not.toHaveClass(textTruncateClassName);
  });

  it('only shows tooltip if text is actually truncated', () => {
    setOffsetWidth(10);
    setScrollWidth(20);

    const { rerender, container } = render(
      <TableCellRenderer cellTextOverflow="truncate">{cellText}</TableCellRenderer>
    );
    expect(container.querySelectorAll(`.${prefix}--tooltip__label`)).toHaveLength(1);
    expect(container.querySelectorAll(`.${iotPrefix}--table__cell-text--truncate`)).toHaveLength(1);

    setOffsetWidth(20);
    setScrollWidth(10);
    rerender(<TableCellRenderer cellTextOverflow="truncate">{cellText}</TableCellRenderer>);
    expect(container.querySelectorAll(`.${prefix}--tooltip__label`)).toHaveLength(0);
    expect(container.querySelectorAll(`.${iotPrefix}--table__cell-text--truncate`)).toHaveLength(1);

    setOffsetWidth(0);
    setScrollWidth(0);
  });

  it('does not show tooltip with allowTooltip={false}', () => {
    setOffsetWidth(10);
    setScrollWidth(20);

    const cellText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
    const { container } = render(
      <TableCellRenderer cellTextOverflow="truncate" allowTooltip={false}>
        {cellText}
      </TableCellRenderer>
    );
    expect(container.querySelectorAll(`.${prefix}--tooltip__label`)).toHaveLength(0);
    expect(container.querySelectorAll(`.${iotPrefix}--table__cell-text--truncate`)).toHaveLength(1);

    setOffsetWidth(0);
    setScrollWidth(0);
  });

  it('locale formats numbers', () => {
    const { rerender } = render(
      <TableCellRenderer locale="fr" truncateCellText wrapText="never">
        {35.6}
      </TableCellRenderer>
    );
    expect(screen.getByText('35,6')).toBeInTheDocument(); // french locale should have commas for decimals

    rerender(
      <TableCellRenderer locale="en" truncateCellText wrapText="never">
        {35.1234567}
      </TableCellRenderer>
    );
    expect(screen.getByText('35.1234567')).toBeInTheDocument(); // no limit on the count of decimals
  });

  it('should set preserve class when preserveCellWhiteSpace:true', () => {
    const { container } = render(
      <TableCellRenderer wrapText="never" truncateCellText columnId="string" preserveCellWhiteSpace>
        1 1 1 1 1
      </TableCellRenderer>
    );

    expect(container.querySelector('span')).toBeVisible();
    expect(container.querySelector('span')).toHaveClass(`${iotPrefix}--table__cell-text--preserve`);
  });

  it('should not set preserve class when preserveCellWhiteSpace:false', () => {
    render(
      <TableCellRenderer wrapText="never" truncateCellText columnId="string">
        1 1
      </TableCellRenderer>
    );

    expect(screen.getByText('1 1')).toBeVisible();
    expect(screen.getByText('1 1')).not.toHaveClass(`${iotPrefix}--table__cell-text--preserve`);
  });

  describe('warning should be thrown for objects as data without needed functions', () => {
    const { __DEV__ } = global;
    const { error } = console;
    let renderDataFunction;

    beforeEach(() => {
      renderDataFunction = jest.fn().mockImplementation(() => '124556');
      global.__DEV__ = true;
      console.error = jest.fn();
    });

    afterEach(() => {
      global.__DEV__ = __DEV__;
      console.error = error;
      jest.clearAllMocks();
    });

    it('should throw warnings if objects are passed as data without a renderer', () => {
      render(
        <TableCellRenderer wrapText="never" truncateCellText locale="en" columnId="object">
          {{ id: '124556' }}
        </TableCellRenderer>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `You must supply a 'renderDataFunction' when passing objects as column values.`
        )
      );
    });

    it('should throw warnings if objects are passed as data and are sortable without sortFunction', () => {
      render(
        <TableCellRenderer
          wrapText="never"
          truncateCellText
          locale="en"
          columnId="object"
          renderDataFunction={renderDataFunction}
          isSortable
        >
          {{ id: '124556' }}
        </TableCellRenderer>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `You must supply a 'sortFunction' when isSortable is true and you're passing objects as column values.`
        )
      );
    });

    it('should throw warnings if objects are passed as data and are filterable without filterFunction', () => {
      render(
        <TableCellRenderer
          wrapText="never"
          truncateCellText
          locale="en"
          columnId="object"
          renderDataFunction={renderDataFunction}
          isFilterable
        >
          {{ id: '124556' }}
        </TableCellRenderer>
      );

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `You must supply a 'filterFunction' when passing objects as column values and want them filterable.`
        )
      );
    });

    it('should not throw errors when a render function is given', () => {
      render(
        <TableCellRenderer
          wrapText="never"
          truncateCellText
          locale="en"
          renderDataFunction={renderDataFunction}
          columnId="object"
        >
          {{ id: '124556' }}
        </TableCellRenderer>
      );

      expect(console.error).not.toHaveBeenCalled();
      expect(renderDataFunction).toHaveBeenCalled();
      expect(screen.getByText('124556')).toBeDefined();
    });

    it('should render a tooltip and display it on focus when one is given', () => {
      render(
        <TableCellRenderer
          wrapText="never"
          truncateCellText
          locale="en"
          tooltip="This is a test tooltip"
        >
          Select
        </TableCellRenderer>
      );

      expect(screen.getByText('Select')).toBeVisible();
      expect(screen.getByRole('tooltip')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Select' })).not.toHaveClass(
        `${prefix}--tooltip--visible`
      );
      expect(document.body).toHaveFocus();
      userEvent.tab();
      expect(screen.getByRole('button', { name: 'Select' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Select' })).toHaveClass(
        `${prefix}--tooltip--visible`
      );
    });

    it('should render a tooltip and display it on hover when one is given', () => {
      render(
        <TableCellRenderer
          wrapText="never"
          truncateCellText
          locale="en"
          tooltip="This is a test tooltip"
        >
          Select
        </TableCellRenderer>
      );

      expect(screen.getByText('Select')).toBeVisible();
      expect(screen.getByRole('tooltip')).toBeDefined();
      expect(screen.getByRole('button', { name: 'Select' })).not.toHaveClass(
        `${prefix}--tooltip--visible`
      );
      userEvent.hover(screen.getByText('Select'));
      expect(screen.getByRole('button', { name: 'Select' })).toHaveClass(
        `${prefix}--tooltip--visible`
      );
    });
  });
});
