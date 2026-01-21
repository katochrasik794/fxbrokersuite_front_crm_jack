import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLoader from '../components/AuthLoader.jsx';

function AdminLoginAs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userDataParam = searchParams.get('userData');

    if (!token) {
      // No token provided, redirect to login
      navigate('/login');
      return;
    }

    try {
      // Decode token from base64
      const decodedToken = decodeURIComponent(atob(token));
      
      // Store token in localStorage
      localStorage.setItem('token', decodedToken);

      // Decode and store user data if provided
      if (userDataParam) {
        try {
          const decodedUserData = JSON.parse(decodeURIComponent(atob(userDataParam)));
          localStorage.setItem('userData', JSON.stringify(decodedUserData));
        } catch (e) {
          console.warn('Failed to decode user data:', e);
        }
      }

      // Redirect to user dashboard
      navigate('/user/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to process login token:', error);
      // If decoding fails, redirect to login
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <AuthLoader message="Logging in as user..." />;
}

export default AdminLoginAs;

