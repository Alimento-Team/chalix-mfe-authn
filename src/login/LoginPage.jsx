import { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { getConfig } from '@edx/frontend-platform';
import { sendPageEvent, sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Form, StatefulButton,
} from '@openedx/paragon';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import Skeleton from 'react-loading-skeleton';

import AccountActivationMessage from './AccountActivationMessage';
import {
  backupLoginFormBegin,
  dismissPasswordResetBanner,
  loginRequest,
} from './data/actions';
import { INVALID_FORM, TPA_AUTHENTICATION_FAILURE } from './data/constants';
import LoginFailureMessage from './LoginFailure';
import messages from './messages';
import {
  FormGroup,
  InstitutionLogistration,
  RedirectLogistration,
  ThirdPartyAuthAlert,
} from '../common-components';
import { getThirdPartyAuthContext } from '../common-components/data/actions';
import { thirdPartyAuthContextSelector } from '../common-components/data/selectors';
import EnterpriseSSO from '../common-components/EnterpriseSSO';
import ThirdPartyAuth from '../common-components/ThirdPartyAuth';
import {
  DEFAULT_STATE, PENDING_STATE,
} from '../data/constants';
import {
  getActivationStatus,
  getAllPossibleQueryParams,
  getTpaHint,
  getTpaProvider,
} from '../data/utils';
import ResetPasswordSuccess from '../reset-password/ResetPasswordSuccess';
import imgImage1 from '../data/logo.png';

const LoginPage = (props) => {
  const {
    backedUpFormData,
    loginErrorCode,
    loginErrorContext,
    loginResult,
    shouldBackupState,
    thirdPartyAuthContext: {
      providers,
      currentProvider,
      secondaryProviders,
      finishAuthUrl,
      platformName,
      errorMessage: thirdPartyErrorMessage,
    },
    thirdPartyAuthApiStatus,
    institutionLogin,
    showResetPasswordSuccessBanner,
    submitState,
    // Actions
    backupFormState,
    handleInstitutionLogin,
    getTPADataFromBackend,
  } = props;
  const { formatMessage } = useIntl();
  const activationMsgType = getActivationStatus();
  const queryParams = useMemo(() => getAllPossibleQueryParams(), []);

  const [formFields, setFormFields] = useState({ ...backedUpFormData.formFields });
  const [errorCode, setErrorCode] = useState({ type: '', count: 0, context: {} });
  const [errors, setErrors] = useState({ ...backedUpFormData.errors });
  const tpaHint = getTpaHint();

  useEffect(() => {
    sendPageEvent('login_and_registration', 'login');
  }, []);

  useEffect(() => {
    const payload = { ...queryParams };
    if (tpaHint) {
      payload.tpa_hint = tpaHint;
    }
    getTPADataFromBackend(payload);
  }, [getTPADataFromBackend, queryParams, tpaHint]);
  /**
   * Backup the login form in redux when login page is toggled.
   */
  useEffect(() => {
    if (shouldBackupState) {
      backupFormState({
        formFields: { ...formFields },
        errors: { ...errors },
      });
    }
  }, [shouldBackupState, formFields, errors, backupFormState]);

  useEffect(() => {
    if (loginErrorCode) {
      setErrorCode(prevState => ({
        type: loginErrorCode,
        count: prevState.count + 1,
        context: { ...loginErrorContext },
      }));
    }
  }, [loginErrorCode, loginErrorContext]);

  useEffect(() => {
    if (thirdPartyErrorMessage) {
      setErrorCode((prevState) => ({
        type: TPA_AUTHENTICATION_FAILURE,
        count: prevState.count + 1,
        context: {
          errorMessage: thirdPartyErrorMessage,
        },
      }));
    }
  }, [thirdPartyErrorMessage]);

  const validateFormFields = (payload) => {
    const { emailOrUsername, password } = payload;
    const fieldErrors = { ...errors };

    if (emailOrUsername === '') {
      fieldErrors.emailOrUsername = 'Vui lòng nhập email hoặc số điện thoại';
    } else if (emailOrUsername.length < 2) {
      fieldErrors.emailOrUsername = 'Email hoặc số điện thoại phải có ít nhất 2 ký tự';
    }
    if (password === '') {
      fieldErrors.password = 'Vui lòng nhập mật khẩu';
    }

    return { ...fieldErrors };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (showResetPasswordSuccessBanner) {
      props.dismissPasswordResetBanner();
    }

    const formData = { ...formFields };
    const validationErrors = validateFormFields(formData);
    if (validationErrors.emailOrUsername || validationErrors.password) {
      setErrors({ ...validationErrors });
      setErrorCode(prevState => ({ type: INVALID_FORM, count: prevState.count + 1, context: {} }));
      return;
    }

    // add query params to the payload
    const payload = {
      email_or_username: formData.emailOrUsername,
      password: formData.password,
      ...queryParams,
    };
    props.loginRequest(payload);
  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setFormFields(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOnFocus = (event) => {
    const { name } = event.target;
    setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
  };

  const { provider, skipHintedLogin } = getTpaProvider(tpaHint, providers, secondaryProviders);

  if (tpaHint) {
    if (thirdPartyAuthApiStatus === PENDING_STATE) {
      return <Skeleton height={36} />;
    }

    if (skipHintedLogin) {
      window.location.href = getConfig().LMS_BASE_URL + provider.loginUrl;
      return null;
    }

    if (provider) {
      return <EnterpriseSSO provider={provider} />;
    }
  }

  if (institutionLogin) {
    return (
      <InstitutionLogistration
        secondaryProviders={secondaryProviders}
        headingTitle={formatMessage(messages['institution.login.page.title'])}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{formatMessage(messages['login.page.title'], { siteName: getConfig().SITE_NAME })}</title>
      </Helmet>
      <RedirectLogistration
        success={loginResult.success}
        redirectUrl={loginResult.redirectUrl}
        finishAuthUrl={finishAuthUrl}
      />

      {/* Error messages positioned absolutely to not interfere with layout */}
      <div className="login-figma-alerts">
        <LoginFailureMessage
          errorCode={errorCode.type}
          errorCount={errorCode.count}
          context={errorCode.context}
        />
        <ThirdPartyAuthAlert
          currentProvider={currentProvider}
          platformName={platformName}
        />
        <AccountActivationMessage
          messageType={activationMsgType}
        />
        {showResetPasswordSuccessBanner && <ResetPasswordSuccess />}
      </div>

      <div className="login-figma-fullscreen">
        <div className="login-figma-card" role="region" aria-label="login card">
          <div className="login-figma-logo" aria-hidden style={{ backgroundImage: `url('${imgImage1}')` }} />

          <div className="login-figma-brand">
            <span className="brand-text">Học với Chalix</span>
          </div>

          <div className="login-figma-title">ĐĂNG NHẬP</div>

          <Form id="sign-in-form" name="sign-in-form" className="login-figma-form" onSubmit={handleSubmit}>
            <div className="login-figma-input-group">
              <label className="login-figma-label">Email / Số điện thoại</label>
              <input
                name="emailOrUsername"
                type="text"
                value={formFields.emailOrUsername}
                placeholder="Email"
                autoComplete="on"
                onChange={handleOnChange}
                onFocus={handleOnFocus}
                className={`login-figma-input ${errors.emailOrUsername ? 'login-figma-input-error' : ''}`}
              />
              {errors.emailOrUsername && (
                <div className="login-figma-error">{errors.emailOrUsername}</div>
              )}
            </div>

            <div className="login-figma-input-group">
              <label className="login-figma-label">Mật khẩu</label>
              <input
                name="password"
                type="password"
                value={formFields.password}
                placeholder="Mật khẩu"
                autoComplete="off"
                onChange={handleOnChange}
                onFocus={handleOnFocus}
                className={`login-figma-input ${errors.password ? 'login-figma-input-error' : ''}`}
              />
              {errors.password && (
                <div className="login-figma-error">{errors.password}</div>
              )}
            </div>

            <StatefulButton
              name="sign-in"
              id="sign-in"
              type="submit"
              variant="brand"
              className="login-figma-submit"
              state={submitState}
              labels={{
                default: 'Đăng nhập',
                pending: '',
              }}
              onClick={handleSubmit}
              onMouseDown={(event) => event.preventDefault()}
            />

            {/* Hide ThirdPartyAuth for clean Figma design */}
            <div style={{ display: 'none' }}>
              <ThirdPartyAuth
                currentProvider={currentProvider}
                providers={providers}
                secondaryProviders={secondaryProviders}
                handleInstitutionLogin={handleInstitutionLogin}
                thirdPartyAuthApiStatus={thirdPartyAuthApiStatus}
                isLoginPage
              />
            </div>
          </Form>

          <div className="login-figma-desc">Sử dụng tài khoản được cấp để đăng nhập</div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = state => {
  const loginPageState = state.login;
  return {
    backedUpFormData: loginPageState.loginFormData,
    loginErrorCode: loginPageState.loginErrorCode,
    loginErrorContext: loginPageState.loginErrorContext,
    loginResult: loginPageState.loginResult,
    shouldBackupState: loginPageState.shouldBackupState,
    showResetPasswordSuccessBanner: loginPageState.showResetPasswordSuccessBanner,
    submitState: loginPageState.submitState,
    thirdPartyAuthContext: thirdPartyAuthContextSelector(state),
    thirdPartyAuthApiStatus: state.commonComponents.thirdPartyAuthApiStatus,
  };
};

LoginPage.propTypes = {
  backedUpFormData: PropTypes.shape({
    formFields: PropTypes.shape({}),
    errors: PropTypes.shape({}),
  }),
  loginErrorCode: PropTypes.string,
  loginErrorContext: PropTypes.shape({
    email: PropTypes.string,
    redirectUrl: PropTypes.string,
    context: PropTypes.shape({}),
  }),
  loginResult: PropTypes.shape({
    redirectUrl: PropTypes.string,
    success: PropTypes.bool,
  }),
  shouldBackupState: PropTypes.bool,
  showResetPasswordSuccessBanner: PropTypes.bool,
  submitState: PropTypes.string,
  thirdPartyAuthApiStatus: PropTypes.string,
  institutionLogin: PropTypes.bool.isRequired,
  thirdPartyAuthContext: PropTypes.shape({
    currentProvider: PropTypes.string,
    errorMessage: PropTypes.string,
    platformName: PropTypes.string,
    providers: PropTypes.arrayOf(PropTypes.shape({})),
    secondaryProviders: PropTypes.arrayOf(PropTypes.shape({})),
    finishAuthUrl: PropTypes.string,
  }),
  // Actions
  backupFormState: PropTypes.func.isRequired,
  dismissPasswordResetBanner: PropTypes.func.isRequired,
  loginRequest: PropTypes.func.isRequired,
  getTPADataFromBackend: PropTypes.func.isRequired,
  handleInstitutionLogin: PropTypes.func.isRequired,
};

LoginPage.defaultProps = {
  backedUpFormData: {
    formFields: {
      emailOrUsername: '', password: '',
    },
    errors: {
      emailOrUsername: '', password: '',
    },
  },
  loginErrorCode: null,
  loginErrorContext: {},
  loginResult: {},
  shouldBackupState: false,
  showResetPasswordSuccessBanner: false,
  submitState: DEFAULT_STATE,
  thirdPartyAuthApiStatus: PENDING_STATE,
  thirdPartyAuthContext: {
    currentProvider: null,
    errorMessage: null,
    finishAuthUrl: null,
    providers: [],
    secondaryProviders: [],
  },
};

export default connect(
  mapStateToProps,
  {
    backupFormState: backupLoginFormBegin,
    dismissPasswordResetBanner,
    loginRequest,
    getTPADataFromBackend: getThirdPartyAuthContext,
  },
)(LoginPage);
