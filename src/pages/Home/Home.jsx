import React, { useState } from 'react'
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';
import { joinLobby } from '../../utils/game';
import { getImageUrl } from '../../utils/image';

/**
 * TODO
 * - Add spinner (throbber) for loading
 */

const Home = () => {
    const navigate = useNavigate();
    const  { username } = useUsername();
    const [gameCode, setGameCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoinLobby = async () => {
        setError('');
        setIsLoading(true);
        try {
            await joinLobby(gameCode, username);
            navigate(`/game/${gameCode}`);
        } catch (error) {
            console.error(error);
            setError(error.message);
        }
        setIsLoading(false);
    };

    const handleCodeChange = (e) => {
        setGameCode((e.target.value).toUpperCase());
        setError('');
    }

    return (
        <div className={styles.Home}>
            <nav className={styles.user}>
                <h4>{username ? username : ''}</h4>
                <img 
                    src={getImageUrl("user/default.png")} 
                    alt="user" 
                    className={styles.pfp}
                />
            </nav>
            <main className={styles.main}>
                <h1 className={styles.title}>County Hunter</h1>
                <h2>Enter game code to join a game</h2>
                <input 
                    className={styles.gameCode}
                    value={gameCode}
                    onChange={(e) => {handleCodeChange(e)}}
                    placeholder='Enter Game Code'
                    maxLength={8}
                />
                <h3>{error && <p style={{ color: 'red' }}>{error}</p>}</h3>
                <div className={styles.buttons}>
                    <button 
                        onClick={handleJoinLobby}
                        className={styles.joinButton}
                        disabled={gameCode.length !== 8}
                    >
                        { isLoading 
                            ? 'Loading...'
                            : 'Join Game'
                        }
                    </button>
                    <h3>or</h3>
                    <button 
                        onClick={() => navigate('/create')}
                        className={styles.createButton}
                        disabled={isLoading}
                    >
                        Create Game
                    </button>
                </div>
            </main>
        </div>
    )
}

export default Home;