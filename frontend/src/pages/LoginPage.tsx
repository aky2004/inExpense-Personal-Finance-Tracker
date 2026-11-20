import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LandingPage } from './LandingPage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; pass?: string } | undefined;

  return (
    <LandingPage
      initialAuthModalOpen={true}
      initialAuthModalMode="login"
      initialEmail={state?.email}
      initialPassword={state?.pass}
      onModalClose={() => navigate('/')}
    />
  );
};

export default LoginPage;