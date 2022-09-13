import React from 'react';
import PropTypes from 'prop-types';
import * as uuid from 'uuid';

import DateTimePickerNew, { propTypes, defaultProps } from './DateTimePickerV2WithTimeSpinner';
import DateTimePickerOld from './DateTimePickerV2WithoutTimeSpinner';

const DateTimePicker = ({
  useNewTimeSpinner,
  testId,
  defaultValue,
  dateTimeMask,
  presets,
  intervals,
  relatives,
  expanded,
  disabled,
  showRelativeOption,
  showCustomRangeLink,
  hasTimeInput,
  renderPresetTooltipText,
  onCancel,
  onApply,
  i18n,
  light,
  locale,
  id = uuid.v4(),
  hasIconOnly,
  menuOffset,
  datePickerType,
  style,
  ...others
}) => {
  return useNewTimeSpinner ? (
    <DateTimePickerNew
      testId={testId}
      defaultValue={defaultValue}
      dateTimeMask={dateTimeMask}
      presets={presets}
      intervals={intervals}
      relatives={relatives}
      expanded={expanded}
      disabled={disabled}
      showRelativeOption={showRelativeOption}
      showCustomRangeLink={showCustomRangeLink}
      hasTimeInput={hasTimeInput}
      renderPresetTooltipText={renderPresetTooltipText}
      onCancel={onCancel}
      onApply={onApply}
      i18n={i18n}
      light={light}
      locale={locale}
      id={id}
      hasIconOnly={hasIconOnly}
      menuOffset={menuOffset}
      datePickerType={datePickerType}
      style={style}
      others={others}
    />
  ) : (
    <DateTimePickerOld
      testId={testId}
      defaultValue={defaultValue}
      dateTimeMask={dateTimeMask}
      presets={presets}
      intervals={intervals}
      relatives={relatives}
      expanded={expanded}
      disabled={disabled}
      showRelativeOption={showRelativeOption}
      showCustomRangeLink={showCustomRangeLink}
      hasTimeInput={hasTimeInput}
      renderPresetTooltipText={renderPresetTooltipText}
      onCancel={onCancel}
      onApply={onApply}
      i18n={i18n}
      light={light}
      locale={locale}
      id={id}
      hasIconOnly={hasIconOnly}
      menuOffset={menuOffset}
      datePickerType={datePickerType}
      style={style}
      others={others}
    />
  );
};

DateTimePicker.propTypes = {
  ...propTypes,
  /** Whether to use new time spinner */
  useNewTimeSpinner: PropTypes.bool,
};

DateTimePicker.defaultProps = {
  ...defaultProps,
  useNewTimeSpinner: false,
};

export default DateTimePicker;
