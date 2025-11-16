import React from 'react';

import { getConfig } from '@edx/frontend-platform';
import { AppProvider } from '@edx/frontend-platform/react';
import { Helmet } from 'react-helmet';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ChalixHeaderWithUserPopup } from '@chalix/frontend-component-header';

import {
  EmbeddedRegistrationRoute, NotFoundPage, registerIcons, UnAuthOnlyRoute, Zendesk,
} from './common-components';
import configureStore from './data/configureStore';
import {
  AUTHN_PROGRESSIVE_PROFILING,
  LOGIN_PAGE,
  PAGE_NOT_FOUND,
  PASSWORD_RESET_CONFIRM,
  RECOMMENDATIONS,
  REGISTER_EMBEDDED_PAGE,
  REGISTER_PAGE,
  RESET_PAGE,
} from './data/constants';
import { updatePathWithQueryParams } from './data/utils';
import { ForgotPasswordPage } from './forgot-password';
import Logistration from './logistration/Logistration';
import { ProgressiveProfiling } from './progressive-profiling';
import { RecommendationsPage } from './recommendations';
import { RegistrationPage } from './register';
import { ResetPasswordPage } from './reset-password';

import './index.scss';

registerIcons();

const MainApp = () => {
  // Handler for header navigation (public pages)
  const handleHeaderNavigation = (tab) => {
    const config = getConfig();
    const lmsBaseUrl = config.LMS_BASE_URL || '';
    
    switch (tab) {
      case 'home':
        window.location.href = `${lmsBaseUrl}/`;
        break;
      case 'category':
        window.location.href = `${lmsBaseUrl}/courses`;
        break;
      case 'learning':
        window.location.href = `${lmsBaseUrl}/login?next=/dashboard`;
        break;
      case 'personalize':
        window.location.href = `${lmsBaseUrl}/login?next=/dashboard`;
        break;
      default:
        break;
    }
  };

  return (
    <AppProvider store={configureStore()}>
      <Helmet>
        <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
      </Helmet>
      {getConfig().ZENDESK_KEY && <Zendesk />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ChalixHeaderWithUserPopup
          organizationTitle="PHẦN MỀM HỌC TẬP THÔNG MINH DÀNH CHO CÔNG CHỨC, VIÊN CHỨC"
          searchPlaceholder="Nhập từ khóa tìm kiếm"
          baseApiUrl={getConfig().LMS_BASE_URL || ''}
          logoutUrl="/logout"
          onNavigate={handleHeaderNavigation}
          hideUserMenu={true}
        />
        <main style={{ flex: 1 }}>
          <Routes>
      <Route path="/" element={<Navigate replace to={updatePathWithQueryParams(REGISTER_PAGE)} />} />
      <Route
        path={REGISTER_EMBEDDED_PAGE}
        element={<EmbeddedRegistrationRoute><RegistrationPage /></EmbeddedRegistrationRoute>}
      />
      <Route
        path={LOGIN_PAGE}
        element={
          <UnAuthOnlyRoute><Logistration selectedPage={LOGIN_PAGE} /></UnAuthOnlyRoute>
        }
      />
      <Route path={REGISTER_PAGE} element={<UnAuthOnlyRoute><Logistration /></UnAuthOnlyRoute>} />
      <Route path={RESET_PAGE} element={<UnAuthOnlyRoute><ForgotPasswordPage /></UnAuthOnlyRoute>} />
      <Route path={PASSWORD_RESET_CONFIRM} element={<ResetPasswordPage />} />
      <Route path={AUTHN_PROGRESSIVE_PROFILING} element={<ProgressiveProfiling />} />
      <Route path={RECOMMENDATIONS} element={<RecommendationsPage />} />
      <Route path={PAGE_NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate replace to={PAGE_NOT_FOUND} />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
};

export default MainApp;
