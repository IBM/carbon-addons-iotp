import { act, waitFor } from '@testing-library/react';
import MockDate from 'mockdate';

import IdleTimer from './IdleTimer';

let timer;

describe('IdleTimer', () => {
  let originalWindowDocumentCookie;
  beforeEach(() => {
    jest.useFakeTimers();
    originalWindowDocumentCookie = window.document.cookie;
    timer = new IdleTimer({});
    timer.onIdleTimeoutWarning = jest.fn();
    timer.onIdleTimeout = jest.fn();
    timer.onRestart = jest.fn();
    timer.onCookieCleared = jest.fn();
  });
  afterEach(() => {
    timer.cleanUp();
    window.document.cookie = originalWindowDocumentCookie;
    jest.useRealTimers();
    MockDate.reset();
  });
  it('starts the timer', () => {
    // Make sure that there are default values for all IdleTimer variables
    expect(timer.COOKIE_CHECK_INTERVAL).not.toBeUndefined();
    expect(timer.ACTIVITY_DEBOUNCE).not.toBeUndefined();
    expect(timer.COUNTDOWN_START).not.toBeUndefined();
    expect(timer.COOKIE_NAME).not.toBeUndefined();
    expect(timer.COOKIE_DOMAIN).not.toBeUndefined();
    expect(timer.TIMEOUT).not.toBeUndefined();
    expect(timer.onIdleTimeoutWarning).not.toBeUndefined();
    expect(timer.onIdleTimeout).not.toBeUndefined();
    expect(timer.onRestart).not.toBeUndefined();
    expect(timer.onCookieCleared).not.toBeUndefined();
    expect(timer.eventHandler).not.toBeUndefined();
    expect(timer.countdown).not.toBeUndefined();
    expect(clearInterval).not.toHaveBeenCalled();
    expect(setInterval).toHaveBeenCalledTimes(1);
  });
  it('does nothing on an interval cycle if timeout has not been reached yet', () => {
    // Simulate a timestamp cookie that is slightly in the future
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() + timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Make sure one cycle of the setInterval runs
    jest.runOnlyPendingTimers();
    expect(timer.onIdleTimeoutWarning).not.toHaveBeenCalled();
    expect(timer.onIdleTimeout).not.toHaveBeenCalled();
    expect(timer.onRestart).not.toHaveBeenCalled();
  });
  it('fires onIdleTimeoutWarning on an interval cycle if timeout has been reached', () => {
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Make sure one cycle of the setInterval runs
    jest.runOnlyPendingTimers();
    // only onIdleTimeoutWarning should have been fired, and countdown should have decreased
    expect(timer.onIdleTimeoutWarning).toHaveBeenCalledWith(timer.COUNTDOWN_START);
    expect(timer.countdown).toEqual(timer.COUNTDOWN_START - 2);
    expect(timer.onIdleTimeout).not.toHaveBeenCalled();
    expect(timer.onRestart).not.toHaveBeenCalled();
  });
  it('fires onIdleTimeoutWarning N times and then onIdleTimeout when countdown reaches zero if timeout has been reached', async () => {
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Make sure COUNTDOWN_START cycles of the setInterval run
    jest.advanceTimersByTime(timer.COUNTDOWN_START * timer.COOKIE_CHECK_INTERVAL);
    // only onIdleTimeoutWarning callbacks should have been fired
    expect(timer.onIdleTimeoutWarning).toHaveBeenCalledTimes(timer.COUNTDOWN_START);
    expect(timer.onIdleTimeout).not.toHaveBeenCalled();
    // Go to the future by a little more than timer.COUNTDOWN_START seconds
    MockDate.set(Date.now() + (timer.COUNTDOWN_START + 1) * timer.COOKIE_CHECK_INTERVAL);
    // Run just one more setInterval cycle
    await act(async () => {
      await jest.runOnlyPendingTimers();
    });
    // now onIdleTimeout should have been fired
    await waitFor(() => expect(timer.onIdleTimeout).toHaveBeenCalled());
    // onRestart should never have been fired
    expect(timer.onRestart).not.toHaveBeenCalled();
    await waitFor(() => expect(timer.onRestart).not.toHaveBeenCalled());
  });
  it('fires onCookieCleared if cookie does not exist anymore', () => {
    // Simulate the scenario where the cookie has already been deleted (handled the same way as if timeout had been reached)
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=;Max-Age=0;`,
    });
    jest.runOnlyPendingTimers();
    // now onIdleTimeout should have been fired
    expect(timer.onCookieCleared).toHaveBeenCalled();
  });
  it('fires onRestart when cookie value is pushed forward during the timeout warning countdown', () => {
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Run just one setInterval cycle
    jest.runOnlyPendingTimers();
    // only onIdleTimeoutWarning should have been fired
    expect(timer.onIdleTimeoutWarning).toHaveBeenCalledWith(timer.COUNTDOWN_START);
    // Simulate a timestamp cookie that is now in the future (some other tab might have pushed it)
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() + timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Run just one setInterval cycle
    jest.runOnlyPendingTimers();
    expect(timer.onIdleTimeout).not.toHaveBeenCalled();
    // onRestart should have been fired
    expect(timer.onRestart).toHaveBeenCalled();
  });
  it('acts on user events pushing the cookie value forward if timeout has not been reached yet', () => {
    // Simulate a timestamp cookie that is in the future
    timer.updateUserInactivityTimeoutCookie = jest.fn();
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() + timer.COOKIE_CHECK_INTERVAL}`,
    });
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('mousedown'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    expect(setTimeout).toHaveBeenCalledTimes(4);
    jest.runOnlyPendingTimers();
    // Debouncing logic should make sure that updateUserInactivityTimeoutCookie is executed only once
    expect(timer.updateUserInactivityTimeoutCookie).toHaveBeenCalledTimes(1);
  });
  it('does not act on user events if timeout has already been reached', () => {
    // Simulate a timestamp cookie that is in the past
    timer.updateUserInactivityTimeoutCookie = jest.fn();
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${timer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('mousedown'));
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('keydown'));
    expect(setTimeout).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(timer.updateUserInactivityTimeoutCookie).not.toHaveBeenCalled();
  });
  it('restarts the timer', () => {
    timer.createUserActivityListeners = jest.fn();
    timer.startIdleUserDetectionInterval = jest.fn();
    timer.restart();
    expect(timer.createUserActivityListeners).toHaveBeenCalled();
    expect(timer.startIdleUserDetectionInterval).toHaveBeenCalled();
  });
  it('cleans up the timer', () => {
    timer.cleanUpUserActivityListeners = jest.fn();
    timer.cleanUp();
    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(timer.cleanUpUserActivityListeners).toHaveBeenCalled();
  });
  it('should clear the existing interval if start is called twice', () => {
    // start is already called in the constructor, so calling it
    // again here will trigger the clearing of the initial interval
    timer.start();
    jest.runOnlyPendingTimers();
    expect(clearInterval).toHaveBeenCalledTimes(1);
  });

  it('should function correctly without passing custom onIdleTimeout/onRestart callbacks', () => {
    const thisTimer = new IdleTimer({
      onIdleTimeoutWarning: jest.fn(),
    });
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${thisTimer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Make sure COUNTDOWN_START cycles of the setInterval run
    jest.advanceTimersByTime(thisTimer.COUNTDOWN_START * timer.COOKIE_CHECK_INTERVAL);
    // only onIdleTimeoutWarning callbacks should have been fired
    expect(thisTimer.onIdleTimeoutWarning).toHaveBeenCalledTimes(thisTimer.COUNTDOWN_START);
  });

  it('should function correctly without passing custom onIdleTimeoutWarning/onRestart callbacks', () => {
    const thisTimer = new IdleTimer({
      onIdleTimeout: jest.fn(),
    });
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${thisTimer.COOKIE_NAME}=${Date.now() - timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Run just one setInterval cycle
    jest.runOnlyPendingTimers();
    // Simulate a timestamp cookie that is now in the future (some other tab might have pushed it)
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `${thisTimer.COOKIE_NAME}=${Date.now() + timer.COOKIE_CHECK_INTERVAL}`,
    });
    // Run just one setInterval cycle
    jest.runOnlyPendingTimers();
    expect(thisTimer.onIdleTimeout).not.toHaveBeenCalled();
  });

  it('should correctly parse more complex cookies', async () => {
    // Simulate a timestamp cookie that is in the past
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: `extra-information={"id":1,"value":"abc"}; ${timer.COOKIE_NAME}=${
        Date.now() - timer.COOKIE_CHECK_INTERVAL
      }; data-info={"id":1,"value":"abc"}`,
    });
    // Make sure COUNTDOWN_START cycles of the setInterval run
    jest.advanceTimersByTime(timer.COUNTDOWN_START * timer.COOKIE_CHECK_INTERVAL);
    // only onIdleTimeoutWarning callbacks should have been fired
    expect(timer.onIdleTimeoutWarning).toHaveBeenCalledTimes(timer.COUNTDOWN_START);
    expect(timer.onIdleTimeout).not.toHaveBeenCalled();
    // Go to the future by a little more than timer.COUNTDOWN_START seconds
    MockDate.set(Date.now() + (timer.COUNTDOWN_START + 1) * timer.COOKIE_CHECK_INTERVAL);
    // Run just one more setInterval cycle
    await act(async () => {
      await jest.runOnlyPendingTimers();
    });
    // now onIdleTimeout should have been fired
    await waitFor(() => expect(timer.onIdleTimeout).toHaveBeenCalled());
    // onRestart should never have been fired
    expect(timer.onRestart).not.toHaveBeenCalled();
    await waitFor(() => expect(timer.onRestart).not.toHaveBeenCalled());
  });
});
