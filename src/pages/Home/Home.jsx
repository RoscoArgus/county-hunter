import React, { useState } from 'react';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import { joinLobby } from '../../utils/game';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { getColorFromName } from '../../utils/user';

const Home = () => {
    const navigate = useNavigate();
    const [gameCode, setGameCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();

    const handleJoinLobby = async () => {
        setError('');
        setIsLoading(true);
        try {
            await joinLobby(gameCode, currentUser);
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
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            setMenuOpen(false);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleKeyDown = (event, action) => {
        if (event.key === 'Enter') {
          action();
        }
    };

    return (
        <div className={styles.Home}>
            <nav className={styles.user}>
                <div className={styles.userInfo} onClick={toggleMenu}>
                    <h4>{ currentUser.displayName ? currentUser.displayName : currentUser.email.split('@')[0]}</h4>
                    { currentUser.photoURL 
                        ? <img 
                            src={currentUser.photoURL} 
                            alt="user" 
                            className={styles.pfp}
                        />
                        : <div class={styles.pfp} style={{backgroundColor: getColorFromName(currentUser.displayName)}}>
                            {currentUser.displayName.charAt(0).toUpperCase()}
                        </div>
                    }
                </div>
                {menuOpen && (
                    <div className={styles.menu}>
                        <ul>
                            <li onClick={() => navigate('/profile')}>Profile</li>
                            <li onClick={handleSignOut} className={styles.destructive}>Sign Out</li>
                        </ul>
                    </div>
                )}
            </nav>
            <main className={styles.main}>
                <h1 className={styles.title}>County Hunter</h1>
                <h2>Enter game code to join a game</h2>
                <input 
                    className={styles.gameCode}
                    value={gameCode}
                    onChange={(e) => handleCodeChange(e)}
                    placeholder='Enter Game Code'
                    maxLength={8}
                    onKeyDown={(e) => handleKeyDown(e, handleJoinLobby)}
                />
                <h3>{error && <p style={{ color: 'red' }}>{error}</p>}</h3>
                <div className={styles.buttons}>
                    <button 
                        onClick={handleJoinLobby}
                        className={styles.joinButton}
                        disabled={gameCode.length !== 8}
                    >
                        {isLoading ? 'Loading...' : 'Join Game'}
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
    );
};

export default Home;