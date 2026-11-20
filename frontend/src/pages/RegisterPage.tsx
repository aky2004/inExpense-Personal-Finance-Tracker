import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from './LandingPage';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LandingPage
      initialAuthModalOpen={true}
      initialAuthModalMode="register"
      onModalClose={() => navigate('/')}
    />
  );
};

export default RegisterPage;