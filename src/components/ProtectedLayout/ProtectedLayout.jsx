import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';

const ProtectedLayout = () => {
  const { username } = useUsername();

  if (!username) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default ProtectedLayout;