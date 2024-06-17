import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectToHome = () => {
    let navigate = useNavigate();
    useEffect(() => {
        navigate('/');
    }, [navigate]);
    return null;
}

export default RedirectToHome;