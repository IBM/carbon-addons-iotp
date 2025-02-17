import React, { useEffect, useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DatePicker,
  DatePickerInput,
  RadioButtonGroup,
  RadioButton,
  FormGroup,
  Select,
  SelectItem,
  NumberInput,
  OrderedList,
  ListItem,
  Layer,
} from '@carbon/react';
import { Calendar, WarningFilled } from '@carbon/react/icons';
import classnames from 'classnames';
import { v4 as uuidv4 } from 'uuid';
import warning from 'warning';
import { useLangDirection } from 'use-lang-direction';

import TimePickerSpinner from '../TimePickerSpinner/TimePickerSpinner';
import { settings } from '../../constants/Settings';
import dayjs, { DAYJS_INPUT_FORMATS } from '../../utils/dayjs';
import {
  PICKER_KINDS,
  PRESET_VALUES,
  INTERVAL_VALUES,
  RELATIVE_VALUES,
} from '../../constants/DateConstants';
import Button from '../Button/Button';
import FlyoutMenu, { FlyoutMenuButtonSize, FlyoutMenuDirection } from '../FlyoutMenu/FlyoutMenu';
import { handleSpecificKeyDown, useOnClickOutside } from '../../utils/componentUtilityFunctions';

import {
  getIntervalValue,
  invalidEndDate,
  invalidStartDate,
  parseValue,
  useAbsoluteDateTimeValue,
  useDateTimePickerKeyboardInteraction,
  useDateTimePickerRangeKind,
  useRelativeDateTimeValue,
  useDateTimePickerClickOutside,
  useCloseDropdown,
  useCustomHeight,
} from './dateTimePickerUtils';

const { iotPrefix, prefix } = settings;

export const DateTimePickerDefaultValuePropTypes = PropTypes.oneOfType([
  PropTypes.exact({
    timeRangeKind: PropTypes.oneOf([PICKER_KINDS.PRESET]).isRequired,
    timeRangeValue: PropTypes.exact({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      /** offset is in minutes */
      offset: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  PropTypes.exact({
    timeRangeKind: PropTypes.oneOf([PICKER_KINDS.RELATIVE]).isRequired,
    timeRangeValue: PropTypes.exact({
      lastNumber: PropTypes.number.isRequired,
      lastInterval: PropTypes.string.isRequired,
      relativeToWhen: PropTypes.string.isRequired,
      relativeToTime: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  PropTypes.exact({
    timeRangeKind: PropTypes.oneOf([PICKER_KINDS.ABSOLUTE]).isRequired,
    timeRangeValue: PropTypes.exact({
      startDate: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      /** Can be a full parsable DateTime string or a Date object */
      start: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      /** Can be a full parsable DateTime string or a Date object */
      end: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endDate: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
]);

const propTypes = {
  testId: PropTypes.string,
  /** default value for the picker */
  defaultValue: DateTimePickerDefaultValuePropTypes,
  /** the dayjs.js format for the human readable interval value */
  dateTimeMask: PropTypes.string,
  /** a list of options to for the default presets */
  presets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      offset: PropTypes.number,
    })
  ),
  /** a list of options to put on the 'Last' interval dropdown */
  intervals: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  /** a list of options to put on the 'Relative to' dropdown */
  relatives: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
    })
  ),
  /** show the picker in the expanded state */
  expanded: PropTypes.bool,
  /** disable the input */
  disabled: PropTypes.bool,
  /** specify the input in invalid state */
  invalid: PropTypes.bool,
  /** show the relative custom range picker */
  showRelativeOption: PropTypes.bool,
  /** show the custom range link */
  showCustomRangeLink: PropTypes.bool,
  /** show time input fields */
  hasTimeInput: PropTypes.bool,
  /**
   * Function hook used to provide the appropriate tooltip content for the preset time
   * picker. This function takes in the currentValue and should return a string message.
   */
  renderPresetTooltipText: PropTypes.func,
  /** triggered on cancel */
  onCancel: PropTypes.func,
  /** triggered on apply with returning object with similar signature to defaultValue */
  onApply: PropTypes.func,
  /** All the labels that need translation */
  i18n: PropTypes.shape({
    toLabel: PropTypes.string,
    toNowLabel: PropTypes.string,
    calendarLabel: PropTypes.string,
    presetLabels: PropTypes.arrayOf(PropTypes.string),
    intervalLabels: PropTypes.arrayOf(PropTypes.string),
    relativeLabels: PropTypes.arrayOf(PropTypes.string),
    customRangeLinkLabel: PropTypes.string,
    customRangeLabel: PropTypes.string,
    relativeLabel: PropTypes.string,
    lastLabel: PropTypes.string,
    invalidNumberLabel: PropTypes.string,
    relativeToLabel: PropTypes.string,
    absoluteLabel: PropTypes.string,
    startDateLabel: PropTypes.string,
    endDateLabel: PropTypes.string,
    startTimeLabel: PropTypes.string,
    endTimeLabel: PropTypes.string,
    applyBtnLabel: PropTypes.string,
    cancelBtnLabel: PropTypes.string,
    backBtnLabel: PropTypes.string,
    increment: PropTypes.string,
    decrement: PropTypes.string,
    hours: PropTypes.string,
    minutes: PropTypes.string,
    number: PropTypes.string,
    invalidText: PropTypes.string,
  }),
  /** Light version  */
  light: PropTypes.bool,
  /** The language locale used to format the days of the week, months, and numbers. */
  locale: PropTypes.string,
  /** Unique id of the component */
  id: PropTypes.string,
  /** Optionally renders only an icon rather than displaying the current selected time */
  hasIconOnly: PropTypes.bool,
  /** Allow repositioning the flyout menu */
  menuOffset: PropTypes.shape({ left: PropTypes.number, top: PropTypes.number }),
  /** If set to true it will render outside of the current DOM in a portal, otherwise render as a child */
  renderInPortal: PropTypes.bool,
  /** Auto reposition if flyout menu offscreen */
  useAutoPositioning: PropTypes.bool,
  style: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  buttonProps: PropTypes.shape({
    className: PropTypes.string,
  }),
};

const defaultProps = {
  testId: 'date-time-picker',
  defaultValue: null,
  dateTimeMask: DAYJS_INPUT_FORMATS.RANGE,
  presets: PRESET_VALUES,
  intervals: [
    {
      label: 'minutes',
      value: INTERVAL_VALUES.MINUTES,
    },
    {
      label: 'hours',
      value: INTERVAL_VALUES.HOURS,
    },
    {
      label: 'days',
      value: INTERVAL_VALUES.DAYS,
    },
    {
      label: 'weeks',
      value: INTERVAL_VALUES.WEEKS,
    },
    {
      label: 'months',
      value: INTERVAL_VALUES.MONTHS,
    },
    {
      label: 'years',
      value: INTERVAL_VALUES.YEARS,
    },
  ],
  relatives: [
    {
      label: 'Today',
      value: RELATIVE_VALUES.TODAY,
    },
    {
      label: 'Yesterday',
      value: RELATIVE_VALUES.YESTERDAY,
    },
  ],
  expanded: false,
  disabled: false,
  invalid: false,
  showRelativeOption: true,
  showCustomRangeLink: true,
  hasTimeInput: true,
  renderPresetTooltipText: null,
  onCancel: null,
  onApply: null,
  i18n: {
    toLabel: 'to',
    toNowLabel: 'to Now',
    calendarLabel: 'Calendar',
    presetLabels: [],
    intervalLabels: [],
    relativeLabels: [],
    customRangeLinkLabel: 'Custom Range',
    customRangeLabel: 'Custom range',
    relativeLabel: 'Relative',
    lastLabel: 'Last',
    invalidNumberLabel: 'Number is not valid',
    relativeToLabel: 'Relative to',
    absoluteLabel: 'Absolute',
    startTimeLabel: 'Start time',
    endTimeLabel: 'End time',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    startAriaLabel: 'Date time start',
    endAriaLabel: 'Date time end',
    applyBtnLabel: 'Apply',
    cancelBtnLabel: 'Cancel',
    backBtnLabel: 'Back',
    increment: 'Increment',
    decrement: 'Decrement',
    hours: 'hours',
    minutes: 'minutes',
    number: 'number',
    invalidText: 'The date time entered is invalid',
  },
  light: false,
  locale: 'en',
  id: undefined,
  hasIconOnly: false,
  menuOffset: undefined,
  renderInPortal: true,
  useAutoPositioning: false,
  style: {},
  buttonProps: {},
};

const DateTimePicker = ({
  testId,
  defaultValue,
  dateTimeMask,
  presets,
  intervals,
  relatives,
  expanded,
  disabled,
  invalid,
  showRelativeOption,
  showCustomRangeLink,
  hasTimeInput,
  renderPresetTooltipText,
  onCancel,
  onApply,
  i18n,
  light,
  locale,
  hasIconOnly,
  menuOffset,
  renderInPortal,
  useAutoPositioning,
  style,
  buttonProps,
  ...others
}) => {
  const id = useRef(others.id || uuidv4()).current;
  React.useEffect(() => {
    if (__DEV__) {
      warning(
        false,
        'The `DateTimePickerV2` is an experimental component and could be lacking unit test and documentation. Be aware that minor version bumps could introduce breaking changes. For the reasons listed above use of this component in production is highly discouraged'
      );
    }
  }, []);

  const langDir = useLangDirection();
  const mergedI18n = useMemo(
    () => ({
      ...defaultProps.i18n,
      ...i18n,
    }),
    [i18n]
  );
  // initialize the dayjs locale
  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

  // State
  const [customRangeKind, setCustomRangeKind, onCustomRangeChange] =
    useDateTimePickerRangeKind(showRelativeOption);
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [currentValue, setCurrentValue] = useState(null);
  const [lastAppliedValue, setLastAppliedValue] = useState(null);
  const [humanValue, setHumanValue] = useState(null);
  const [invalidState, setInvalidState] = useState(invalid);
  const relativeSelect = useRef(null);
  const containerRef = useRef();
  const dropdownRef = useRef();
  const updatedStyle = useMemo(
    () => ({
      ...style,
      '--zIndex': style.zIndex ?? 0,
    }),
    [style]
  );
  const {
    absoluteValue,
    setAbsoluteValue,
    absoluteStartTimeInvalid,
    setAbsoluteStartTimeInvalid,
    absoluteEndTimeInvalid,
    setAbsoluteEndTimeInvalid,
    onAbsoluteStartTimeChange,
    onAbsoluteEndTimeChange,
    resetAbsoluteValue,
  } = useAbsoluteDateTimeValue();

  const {
    relativeValue,
    setRelativeValue,
    relativeToTimeInvalid,
    resetRelativeValue,
    relativeLastNumberInvalid,
    onRelativeLastNumberChange,
    onRelativeLastIntervalChange,
    onRelativeToWhenChange,
    onRelativeToTimeChange,
  } = useRelativeDateTimeValue({
    defaultInterval: intervals[0].value,
    defaultRelativeTo: relatives[0].value,
  });

  const {
    isExpanded,
    setIsExpanded,
    presetListRef,
    onFieldInteraction,
    onNavigateRadioButton,
    onNavigatePresets,
  } = useDateTimePickerKeyboardInteraction({ expanded, setCustomRangeKind });

  const dateTimePickerBaseValue = {
    kind: '',
    preset: {
      id: presets[0].id,
      label: presets[0].label,
      offset: presets[0].offset,
    },
    relative: {
      lastNumber: null,
      lastInterval: intervals[0].value,
      relativeToWhen: relatives[0].value,
      relativeToTime: null,
    },
    absolute: {
      startDate: null,
      startTime: null,
      endDate: null,
      endTime: null,
    },
  };

  /**
   * Transforms a default or selected value into a full blown returnable object
   * @param {Object} [preset] clicked preset
   * @param {string} preset.label preset label
   * @param {number} preset.offset preset offset in minutes
   * @returns {Object} the augmented value itself and the human readable value
   */
  const renderValue = (clickedPreset = null) => {
    const value = { ...dateTimePickerBaseValue };
    if (isCustomRange) {
      if (customRangeKind === PICKER_KINDS.RELATIVE) {
        value.relative = relativeValue;
      } else {
        value.absolute = absoluteValue;
      }
      value.kind = customRangeKind;
    } else {
      const preset = presets
        .filter((p) => {
          let filteredPreset;
          if (p.id) {
            filteredPreset = p.id === (clickedPreset ? clickedPreset.id : selectedPreset);
          } else {
            filteredPreset = p.offset === (clickedPreset ? clickedPreset.offset : selectedPreset);
          }
          return filteredPreset;
        })
        .pop();
      value.preset = preset;
      value.kind = PICKER_KINDS.PRESET;
    }
    setCurrentValue(value);
    const parsedValue = parseValue(value, dateTimeMask, mergedI18n.toLabel);
    setHumanValue(parsedValue.readableValue);

    return {
      ...value,
      ...parsedValue,
    };
  };

  useEffect(
    () => {
      if (absoluteValue || relativeValue) {
        renderValue();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [absoluteValue, relativeValue]
  );

  const onDatePickerChange = ([start, end]) => {
    const newAbsolute = { ...absoluteValue };
    newAbsolute.start = start;
    newAbsolute.startDate = start ? dayjs(newAbsolute.start).format('MM/DD/YYYY') : '';
    newAbsolute.end = end;
    newAbsolute.endDate = end ? dayjs(newAbsolute.end).format('MM/DD/YYYY') : '';

    setAbsoluteValue(newAbsolute);

    // Update end and start time invalid state when date changed
    setAbsoluteEndTimeInvalid(
      invalidEndDate(newAbsolute.startTime, newAbsolute.endTime, newAbsolute)
    );
    setAbsoluteStartTimeInvalid(
      invalidStartDate(newAbsolute.startTime, newAbsolute.endTime, newAbsolute)
    );
  };

  const onPresetClick = (preset) => {
    setSelectedPreset(preset.id ?? preset.offset);
    renderValue(preset);
  };

  const parseDefaultValue = (parsableValue) => {
    const currentCustomRangeKind = showRelativeOption
      ? PICKER_KINDS.RELATIVE
      : PICKER_KINDS.ABSOLUTE;
    if (parsableValue !== null) {
      if (parsableValue.timeRangeKind === PICKER_KINDS.PRESET) {
        // preset
        resetAbsoluteValue();
        resetRelativeValue();
        setCustomRangeKind(currentCustomRangeKind);
        onPresetClick(parsableValue.timeRangeValue);
      }
      if (parsableValue.timeRangeKind === PICKER_KINDS.RELATIVE) {
        // relative
        resetAbsoluteValue();
        setIsCustomRange(true);
        setCustomRangeKind(currentCustomRangeKind);
        setRelativeValue(parsableValue.timeRangeValue);
      }

      if (parsableValue.timeRangeKind === PICKER_KINDS.ABSOLUTE) {
        // absolute
        const absolute = { ...parsableValue.timeRangeValue };
        resetRelativeValue();
        setIsCustomRange(true);
        setCustomRangeKind(PICKER_KINDS.ABSOLUTE);
        if (!absolute.hasOwnProperty('start')) {
          absolute.start = dayjs(`${absolute.startDate} ${absolute.startTime}`).valueOf();
        }
        if (!absolute.hasOwnProperty('end')) {
          absolute.end = dayjs(`${absolute.endDate} ${absolute.endTime}`).valueOf();
        }
        absolute.startDate = dayjs(absolute.start).format('MM/DD/YYYY');
        absolute.startTime = dayjs(absolute.start).format('HH:mm');
        absolute.endDate = dayjs(absolute.end).format('MM/DD/YYYY');
        absolute.endTime = dayjs(absolute.end).format('HH:mm');
        setAbsoluteValue(absolute);
      }
    } else {
      resetAbsoluteValue();
      resetRelativeValue();
      setCustomRangeKind(currentCustomRangeKind);
      onPresetClick(presets[0]);
    }
  };

  const toggleIsCustomRange = (event) => {
    // stop the event from bubbling
    event.stopPropagation();
    setIsCustomRange(!isCustomRange);

    // If value was changed reset when going back to Preset
    if (absoluteValue.startDate !== '' || relativeValue.lastNumber > 0) {
      if (selectedPreset) {
        onPresetClick(presets.filter((p) => p.id ?? p.offset === selectedPreset)[0]);
        resetAbsoluteValue();
        resetRelativeValue();
      } else {
        onPresetClick(presets[0]);
        resetAbsoluteValue();
        resetRelativeValue();
      }
    }
  };

  useEffect(
    () => {
      /* istanbul ignore else */
      if (defaultValue || humanValue === null) {
        parseDefaultValue(defaultValue);
        setLastAppliedValue(defaultValue);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultValue]
  );

  const tooltipValue = renderPresetTooltipText
    ? renderPresetTooltipText(currentValue)
    : getIntervalValue({ currentValue, mergedI18n, dateTimeMask, humanValue });

  const disableRelativeApply =
    isCustomRange &&
    customRangeKind === PICKER_KINDS.RELATIVE &&
    (relativeLastNumberInvalid || relativeToTimeInvalid);

  const disableAbsoluteApply =
    isCustomRange &&
    customRangeKind === PICKER_KINDS.ABSOLUTE &&
    (absoluteStartTimeInvalid ||
      absoluteEndTimeInvalid ||
      (absoluteValue.startDate === '' && absoluteValue.endDate === '') ||
      (hasTimeInput ? !absoluteValue.startTime || !absoluteValue.endTime : false));

  const disableApply = disableRelativeApply || disableAbsoluteApply;

  useEffect(() => setInvalidState(invalid || disableApply), [invalid, disableApply]);

  const onApplyClick = () => {
    setIsExpanded(false);
    const value = renderValue();
    setLastAppliedValue(value);
    const returnValue = {
      timeRangeKind: value.kind,
      timeRangeValue: null,
    };
    switch (value.kind) {
      case PICKER_KINDS.ABSOLUTE:
        returnValue.timeRangeValue = {
          ...value.absolute,
          humanValue,
          tooltipValue,
        };
        break;
      case PICKER_KINDS.RELATIVE:
        returnValue.timeRangeValue = {
          ...value.relative,
          humanValue,
          tooltipValue,
        };
        break;
      default:
        returnValue.timeRangeValue = {
          ...value.preset,
          tooltipValue,
        };
        break;
    }

    if (onApply) {
      onApply(returnValue);
    }
  };

  const onCancelClick = () => {
    parseDefaultValue(lastAppliedValue);
    setIsExpanded(false);

    /* istanbul ignore else */
    if (onCancel) {
      onCancel();
    }
  };

  const closeDropdown = useCloseDropdown({
    isExpanded,
    isCustomRange,
    setIsCustomRange,
    setIsExpanded,
    parseDefaultValue,
    defaultValue,
    setCustomRangeKind,
    lastAppliedValue,
  });

  const onClickOutside = useDateTimePickerClickOutside(closeDropdown, containerRef);

  useOnClickOutside(dropdownRef, onClickOutside);

  // eslint-disable-next-line react/prop-types
  const CustomFooter = () => {
    return (
      <div className={`${iotPrefix}--date-time-picker__menu-btn-set`}>
        {isCustomRange ? (
          <Button
            kind="secondary"
            className={`${iotPrefix}--date-time-picker__menu-btn ${iotPrefix}--date-time-picker__menu-btn-back`}
            size="md"
            {...others}
            onClick={toggleIsCustomRange}
            onKeyUp={handleSpecificKeyDown(['Enter', ' '], toggleIsCustomRange)}
          >
            {mergedI18n.backBtnLabel}
          </Button>
        ) : (
          <Button
            kind="secondary"
            className={`${iotPrefix}--date-time-picker__menu-btn ${iotPrefix}--date-time-picker__menu-btn-cancel`}
            onClick={onCancelClick}
            size="md"
            {...others}
            onKeyUp={handleSpecificKeyDown(['Enter', ' '], onCancelClick)}
          >
            {mergedI18n.cancelBtnLabel}
          </Button>
        )}
        <Button
          kind="primary"
          className={`${iotPrefix}--date-time-picker__menu-btn ${iotPrefix}--date-time-picker__menu-btn-apply`}
          {...others}
          onClick={onApplyClick}
          onKeyUp={handleSpecificKeyDown(['Enter', ' '], onApplyClick)}
          size="md"
          disabled={disableApply}
        >
          {mergedI18n.applyBtnLabel}
        </Button>
      </div>
    );
  };

  const menuOffsetLeft = menuOffset?.left
    ? menuOffset.left
    : langDir === 'ltr'
    ? 0
    : hasIconOnly
    ? -15
    : 288;
  const menuOffsetTop = menuOffset?.top ? menuOffset.top : 0;

  const [offTop, , inputTop, inputBottom, customHeight, maxHeight] = useCustomHeight({
    containerRef,
    isCustomRange,
    showRelativeOption,
    customRangeKind,
    setIsExpanded,
  });

  const direction = offTop ? FlyoutMenuDirection.BottomEnd : FlyoutMenuDirection.TopEnd;

  const tooltipField = (
    <div
      className={classnames({
        [`${iotPrefix}--date-time-picker__box--full`]: !hasIconOnly,
        [`${iotPrefix}--date-time-picker__box--light`]: light,
        [`${iotPrefix}--date-time-picker__box--disabled`]: disabled,
        [`${iotPrefix}--date-time-picker__box--invalid`]: invalidState,
      })}
    >
      {!hasIconOnly ? (
        <div data-testid={`${testId}__field`} className={`${iotPrefix}--date-time-picker__field`}>
          {isExpanded ||
          (currentValue && currentValue.kind !== PICKER_KINDS.PRESET) ||
          humanValue ? (
            <span
              className={classnames({
                [`${iotPrefix}--date-time-picker__disabled`]: disabled,
              })}
              title={humanValue}
            >
              {humanValue}
            </span>
          ) : null}
        </div>
      ) : null}

      <FlyoutMenu
        isOpen={isExpanded}
        buttonSize={hasIconOnly ? FlyoutMenuButtonSize.Default : FlyoutMenuButtonSize.Small}
        renderIcon={invalidState ? WarningFilled : Calendar}
        iconDescription={(invalidState ? i18n.invalidText : i18n.calendarLabel) ?? ''}
        disabled={disabled}
        buttonProps={{
          size: 'lg',
          tooltipPosition: 'top',
          tabIndex: -1,
          className: classnames(
            [`${iotPrefix}--date-time-picker--trigger-button`, buttonProps.className ?? ''],
            {
              [`${iotPrefix}--date-time-picker--trigger-button--invalid`]: invalid,
              [`${iotPrefix}--date-time-picker--trigger-button--disabled`]: disabled,
            }
          ),
        }}
        hideTooltip
        passive={false}
        triggerId={`test-trigger-${id}`}
        light={light}
        menuOffset={{
          top: menuOffsetTop,
          left: menuOffsetLeft,
          inputTop,
          inputBottom,
        }}
        testId={`${testId}-datepicker-flyout`}
        direction={direction}
        tooltipFocusTrap={false}
        renderInPortal={renderInPortal}
        useAutoPositioning={useAutoPositioning}
        tooltipClassName={classnames(`${iotPrefix}--date-time-picker--tooltip`, {
          [`${iotPrefix}--date-time-picker--tooltip--icon`]: hasIconOnly,
        })}
        tooltipContentClassName={`${iotPrefix}--date-time-picker--menu`}
        style={updatedStyle}
      >
        <div
          ref={dropdownRef}
          className={`${iotPrefix}--date-time-picker__menu-scroll`}
          style={{
            '--wrapper-width': '20rem',
            height: customHeight,
            maxHeight,
          }}
          role="presentation"
          onClick={(event) => event.stopPropagation()} // need to stop the event so that it will not close the menu
          onKeyDown={(event) => event.stopPropagation()} // need to stop the event so that it will not close the menu
          tabIndex="-1"
        >
          {!isCustomRange ? (
            // Catch bubbled Up/Down keys from the preset list and move focus.
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
              ref={presetListRef}
              onKeyDown={handleSpecificKeyDown(['ArrowUp', 'ArrowDown'], onNavigatePresets)}
            >
              <OrderedList nested={false}>
                {tooltipValue ? (
                  <ListItem
                    className={`${iotPrefix}--date-time-picker__listitem ${iotPrefix}--date-time-picker__listitem--current`}
                  >
                    {tooltipValue}
                  </ListItem>
                ) : null}
                {showCustomRangeLink ? (
                  <ListItem
                    onClick={toggleIsCustomRange}
                    onKeyDown={handleSpecificKeyDown(['Enter', ' '], toggleIsCustomRange)}
                    className={`${iotPrefix}--date-time-picker__listitem ${iotPrefix}--date-time-picker__listitem--preset ${iotPrefix}--date-time-picker__listitem--custom`}
                    tabIndex={0}
                  >
                    {mergedI18n.customRangeLinkLabel}
                  </ListItem>
                ) : null}
                {presets.map((preset, i) => {
                  return (
                    <ListItem
                      key={i}
                      onClick={() => onPresetClick(preset)}
                      onKeyDown={handleSpecificKeyDown(['Enter', ' '], () => onPresetClick(preset))}
                      className={classnames(
                        `${iotPrefix}--date-time-picker__listitem ${iotPrefix}--date-time-picker__listitem--preset`,
                        {
                          [`${iotPrefix}--date-time-picker__listitem--preset-selected`]:
                            selectedPreset === (preset.id ?? preset.offset),
                        }
                      )}
                      tabIndex={0}
                    >
                      {mergedI18n.presetLabels[i] || preset.label}
                    </ListItem>
                  );
                })}
              </OrderedList>
            </div>
          ) : (
            <div
              className={`${iotPrefix}--date-time-picker__custom-wrapper`}
              style={{ '--wrapper-width': '20rem' }}
            >
              {showRelativeOption ? (
                <FormGroup
                  legendText={mergedI18n.customRangeLabel}
                  className={`${iotPrefix}--date-time-picker__menu-formgroup`}
                >
                  <RadioButtonGroup
                    valueSelected={customRangeKind}
                    onChange={onCustomRangeChange}
                    name={`${id}-radiogroup`}
                  >
                    <RadioButton
                      value={PICKER_KINDS.RELATIVE}
                      id={`${id}-relative`}
                      labelText={mergedI18n.relativeLabel}
                      onKeyDown={handleSpecificKeyDown(
                        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                        onNavigateRadioButton
                      )}
                    />
                    <RadioButton
                      value={PICKER_KINDS.ABSOLUTE}
                      id={`${id}-absolute`}
                      labelText={mergedI18n.absoluteLabel}
                      onKeyDown={handleSpecificKeyDown(
                        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                        onNavigateRadioButton
                      )}
                    />
                  </RadioButtonGroup>
                </FormGroup>
              ) : null}
              {showRelativeOption && customRangeKind === PICKER_KINDS.RELATIVE ? (
                <>
                  <FormGroup
                    legendText={mergedI18n.lastLabel}
                    className={`${iotPrefix}--date-time-picker__menu-formgroup`}
                  >
                    <div
                      className={classnames(
                        `${iotPrefix}--date-time-picker__fields-wrapper`,
                        `${iotPrefix}--date-time-picker__fields-wrapper--with-gap`
                      )}
                    >
                      <Layer>
                        <NumberInput
                          id={`${id}-last-number`}
                          invalidText={mergedI18n.invalidNumberLabel}
                          step={1}
                          min={0}
                          value={relativeValue ? relativeValue.lastNumber : 0}
                          onChange={onRelativeLastNumberChange}
                          translateWithId={(messageId) =>
                            messageId === 'increment.number'
                              ? `${i18n.increment} ${i18n.number}`
                              : messageId === 'decrement.number'
                              ? `${i18n.decrement} ${i18n.number}`
                              : null
                          }
                        />
                      </Layer>
                      <Layer>
                        <Select
                          {...others}
                          id={`${id}-last-interval`}
                          defaultValue={
                            relativeValue ? relativeValue.lastInterval : INTERVAL_VALUES.MINUTES
                          }
                          onChange={onRelativeLastIntervalChange}
                          hideLabel
                        >
                          {intervals.map((interval, i) => {
                            return (
                              <SelectItem
                                key={i}
                                value={interval.value}
                                text={mergedI18n.intervalLabels[i] || interval.label}
                              />
                            );
                          })}
                        </Select>
                      </Layer>
                    </div>
                  </FormGroup>
                  <FormGroup
                    legendText={mergedI18n.relativeToLabel}
                    className={`${iotPrefix}--date-time-picker__menu-formgroup`}
                  >
                    <div
                      className={classnames(
                        `${iotPrefix}--date-time-picker__fields-wrapper`,
                        `${iotPrefix}--date-time-picker__fields-wrapper--with-gap`
                      )}
                    >
                      <Layer>
                        <Select
                          {...others}
                          ref={relativeSelect}
                          id={`${id}-relative-to-when`}
                          defaultValue={relativeValue ? relativeValue.relativeToWhen : ''}
                          onChange={onRelativeToWhenChange}
                          hideLabel
                        >
                          {relatives.map((relative, i) => {
                            return (
                              <SelectItem
                                key={i}
                                value={relative.value}
                                text={mergedI18n.relativeLabels[i] || relative.label}
                              />
                            );
                          })}
                        </Select>
                      </Layer>
                      {hasTimeInput ? (
                        <Layer>
                          <TimePickerSpinner
                            id={`${id}-relative-to-time`}
                            invalid={relativeToTimeInvalid}
                            value={relativeValue ? relativeValue.relativeToTime : ''}
                            i18n={i18n}
                            onChange={onRelativeToTimeChange}
                            spinner
                            autoComplete="off"
                          />
                        </Layer>
                      ) : null}
                    </div>
                  </FormGroup>
                </>
              ) : (
                <div data-testid={`${testId}-datepicker`}>
                  <FormGroup className={`${iotPrefix}--date-time-picker__menu-formgroup`}>
                    <Layer>
                      <DatePicker
                        datePickerType="range"
                        dateFormat="m/d/Y"
                        onChange={onDatePickerChange}
                        value={
                          absoluteValue ? [absoluteValue.startDate, absoluteValue.endDate] : ''
                        }
                        locale={locale?.split('-')[0]}
                      >
                        <DatePickerInput
                          labelText={mergedI18n.startDateLabel}
                          aria-label={mergedI18n.startAriaLabel}
                          id={`${id}-date-picker-input-start`}
                        />
                        <DatePickerInput
                          labelText={mergedI18n.endDateLabel}
                          aria-label={mergedI18n.endAriaLabel}
                          id={`${id}-date-picker-input-end`}
                        />
                      </DatePicker>
                    </Layer>
                  </FormGroup>
                  {hasTimeInput ? (
                    <FormGroup
                      legendText=""
                      className={`${iotPrefix}--date-time-picker__menu-formgroup`}
                    >
                      <div className={`${iotPrefix}--date-time-picker__fields-wrapper`}>
                        <Layer>
                          <TimePickerSpinner
                            id={`${id}-start-time`}
                            invalid={absoluteStartTimeInvalid}
                            labelText={mergedI18n.startTimeLabel}
                            value={absoluteValue ? absoluteValue.startTime : null}
                            i18n={i18n}
                            onChange={onAbsoluteStartTimeChange}
                            spinner
                            autoComplete="off"
                          />
                        </Layer>
                        <Layer>
                          <TimePickerSpinner
                            id={`${id}-end-time`}
                            invalid={absoluteEndTimeInvalid}
                            labelText={mergedI18n.endTimeLabel}
                            value={absoluteValue ? absoluteValue.endTime : null}
                            i18n={i18n}
                            onChange={onAbsoluteEndTimeChange}
                            spinner
                            autoComplete="off"
                          />
                        </Layer>
                      </div>
                    </FormGroup>
                  ) : (
                    <div className={`${iotPrefix}--date-time-picker__no-formgroup`} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {CustomFooter()}
      </FlyoutMenu>
    </div>
  );

  return (
    <div className={`${iotPrefix}--date-time-pickerv2`} ref={containerRef}>
      <div
        data-testid={testId}
        id={`${id}-${iotPrefix}--date-time-pickerv2__wrapper`}
        className={classnames(`${iotPrefix}--date-time-pickerv2__wrapper`, {
          [`${iotPrefix}--date-time-pickerv2__wrapper--disabled`]: disabled,
          [`${iotPrefix}--date-time-pickerv2__wrapper--invalid`]: invalidState,
        })}
        style={{ '--wrapper-width': hasIconOnly ? '3rem' : '20rem' }}
        role="button"
        onClick={onFieldInteraction}
        onKeyDown={handleSpecificKeyDown(['Enter', ' ', 'Escape', 'ArrowDown'], (event) => {
          // the onApplyClick event gets blocked when called via the keyboard from the flyout menu's
          // custom footer. This is a catch to ensure the onApplyCLick is called correctly for preset
          // ranges via the keyboard.
          if (
            (event.key === 'Enter' || event.key === ' ') &&
            event.target.classList.contains(`${iotPrefix}--date-time-picker__menu-btn-apply`) &&
            !isCustomRange
          ) {
            onApplyClick();
          }

          onFieldInteraction(event);
        })}
        tabIndex={0}
      >
        {tooltipField}
      </div>
      {invalidState && !hasIconOnly ? (
        <p
          className={classnames(
            `${prefix}--form__helper-text`,
            `${iotPrefix}--date-time-picker__helper-text--invalid`
          )}
        >
          {mergedI18n.invalidText}
        </p>
      ) : null}
    </div>
  );
};

DateTimePicker.propTypes = propTypes;
DateTimePicker.defaultProps = defaultProps;

export default DateTimePicker;
