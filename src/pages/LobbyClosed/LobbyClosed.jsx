import React from 'react'
import { useNavigate } from 'react-router-dom';

const LobbyClosed = () => {

    const navigate = useNavigate();
    return (
        <div>
            This lobby has been closed or does not exist.
            <button onClick={() => navigate('/')}>Return to Home</button>
        </div>
        
    )
}

export default LobbyClosed;