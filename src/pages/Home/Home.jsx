import React, { useState } from 'react'
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';
import { joinLobby } from '../../utils/game';

const Home = () => {

    const navigate = useNavigate();
    const  { username } = useUsername();
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState('');

    const handleJoinLobby = async () => {
        //TODO REMOVE
        setError('');
        try {
          await joinLobby(gameCode, username);
          navigate(`/game/${gameCode}`);
        } catch (error) {
            console.error(error);
          setError(error.message);
        }
      };

    return (
        <div className={styles.Home}>
            <div className={styles.instructions}>
                <h2>Username: {username ? username : ''}</h2>
                <h1 className={styles.title}>Welcome to County Hunter</h1>
                <div className={styles.join}>
                    <input 
                        value={gameCode}
                        onChange={(e) => setGameCode(e.target.value)}
                        placeholder='Enter Game Code to Join' 
                        maxLength={16}
                    />
                    <button onClick={handleJoinLobby}>Join Game</button>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={() => navigate('/create')}>Create Game</button>
            </div>
        </div>
    )
}

export default Home;