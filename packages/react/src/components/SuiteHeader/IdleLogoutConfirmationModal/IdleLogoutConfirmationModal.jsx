import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { settings } from '../../../constants/Settings';
import { Modal } from '../../Modal';
import IdleTimer from '../util/IdleTimer';
import { SUITE_HEADER_ROUTE_TYPES } from '../suiteHeaderConstants';
import useMerged from '../../../hooks/useMerged';

export const IdleLogoutConfirmationModalIdleTimeoutPropTypes = {
  /** User inactivity timeout, in seconds */
  timeout: PropTypes.number,
  /** Countdown start value, in seconds, for the logout confirmation modal */
  countdown: PropTypes.number,
  /** Cookie name for cross-tab support */
  cookieName: PropTypes.string,
};

export const IdleLogoutConfirmationModalRoutePropTypes = {
  /** Route for the logout redirect page when Log out button is clicked */
  logout: PropTypes.string,
  /** Route for the logout redirect page when user is logged out due to inactivity */
  logoutInactivity: PropTypes.string,
  /** Cookie domain for cross-tab support */
  domain: PropTypes.string,
};

export const IdleLogoutConfirmationModalI18NPropTypes = {
  sessionTimeoutModalHeading: PropTypes.string,
  sessionTimeoutModalBody: PropTypes.string,
  sessionTimeoutModalLogoutButton: PropTypes.string,
  sessionTimeoutModalStayLoggedInButton: PropTypes.string,
};

const defaultProps = {
  className: null,
  idleTimeoutData: {
    timeout: 1800, // 30 minutes
    countdown: 30, // 30 seconds
    cookieName: '_user_inactivity_timeout',
  },
  routes: null,
  onRouteChange: async () => Promise.resolve(true),
  onStayLoggedIn: () => {},
  i18n: {
    sessionTimeoutModalHeading: 'Session Timeout',
    sessionTimeoutModalBody: 'You will be logged out due to inactivity in {countdown} seconds.',
    sessionTimeoutModalLogoutButton: 'Log out',
    sessionTimeoutModalStayLoggedInButton: 'Stay logged in',
    closeButtonLabel: 'Close',
  },
};

const propTypes = {
  /** Add class name to the rendered Modal component */
  className: PropTypes.string,
  /** User inactivity timeout data */
  idleTimeoutData: PropTypes.shape(IdleLogoutConfirmationModalIdleTimeoutPropTypes),
  /** URLs for routes used on this component */
  routes: PropTypes.shape(IdleLogoutConfirmationModalRoutePropTypes),
  /** Function called before any route change. Returns a Promise<Boolean>. False means the redirect will not happen. This function should never throw an error. */
  onRouteChange: PropTypes.func,
  /** Custom function that can be provided in case something else needs to be done when the "Stay logged in" button is clicked */
  onStayLoggedIn: PropTypes.func,
  /** I18N strings */
  i18n: PropTypes.shape(IdleLogoutConfirmationModalI18NPropTypes),
};

const IdleLogoutConfirmationModal = ({
  className,
  idleTimeoutData,
  routes,
  onRouteChange,
  onStayLoggedIn,
  i18n,
}) => {
  const mergedI18n = useMerged(defaultProps.i18n, i18n);

  const translate = useCallback(
    (string, substitutions) =>
      substitutions.reduce((acc, [key, val]) => acc.replace(key, val), string),
    []
  );

  // This state is just to force the recreation of the IdleTimer object in the useEffect below
  const [restartIdleTimer, setRestartIdleTimer] = useState(false);
  // Countdown state. If countdown is greater than zero, logout confirmation dialog is going to be displayed
  const [logoutConfirmationCountdown, setLogoutConfirmationCountdown] = useState(0);
  // "Stay Logged in" button disabled state
  const [stayLoggedInButtonDisabled, setStayLoggedInButtonDisabled] = useState(false);
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (idleTimeoutData && idleTimeoutData?.timeout > 0 && routes) {
      const timer = new IdleTimer({
        timeout: idleTimeoutData.timeout,
        countdown: idleTimeoutData.countdown,
        cookieName: idleTimeoutData.cookieName,
        cookieDomain: routes.domain,
        onIdleTimeoutWarning: (c) => {
          setLogoutConfirmationCountdown(c);
        },
        onIdleTimeout: async () => {
          const result = await onRouteChange(
            SUITE_HEADER_ROUTE_TYPES.LOGOUT,
            routes.logoutInactivity
          );
          if (result) {
            window.location.href = routes.logoutInactivity;
          }
        },
        onCookieCleared: async () => {
          const result = await onRouteChange(SUITE_HEADER_ROUTE_TYPES.LOGOUT, routes.logout);
          if (result) {
            window.location.href = routes.logout;
          }
        },
        onRestart: () => {
          setLogoutConfirmationCountdown(0);
          onStayLoggedIn();
        },
      });

      return () => {
        timer.cleanUp();
      };
    }
  }, [restartIdleTimer, idleTimeoutData, routes, onRouteChange, onStayLoggedIn]);

  return (
    <Modal
      data-testid="idle-logout-confirmation"
      className={classnames(`${settings.iotPrefix}--session-timeout-modal`, className)}
      size="sm"
      closeButtonLabel={mergedI18n.closeButtonLabel}
      open={logoutConfirmationCountdown > 0}
      modalHeading={mergedI18n.sessionTimeoutModalHeading}
      primaryButtonText={mergedI18n.sessionTimeoutModalStayLoggedInButton}
      primaryButtonDisabled={stayLoggedInButtonDisabled}
      secondaryButtonText={mergedI18n.sessionTimeoutModalLogoutButton}
      onSecondarySubmit={async () => {
        // Disable the "Stay Logged in" button after the "Log out" button is clicked
        setStayLoggedInButtonDisabled(true);
        const result = await onRouteChange(SUITE_HEADER_ROUTE_TYPES.LOGOUT, routes?.logout);
        if (result) {
          window.location.href = routes?.logout;
        }
      }}
      onRequestSubmit={() => {
        setLogoutConfirmationCountdown(0);
        setRestartIdleTimer((prevRestartIdleTimer) => !prevRestartIdleTimer);
        onStayLoggedIn();
      }}
    >
      {translate(mergedI18n.sessionTimeoutModalBody, [
        ['{countdown}', logoutConfirmationCountdown],
      ])}
    </Modal>
  );
};

IdleLogoutConfirmationModal.defaultProps = defaultProps;
IdleLogoutConfirmationModal.propTypes = propTypes;

export default IdleLogoutConfirmationModal;
