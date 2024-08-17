import React from 'react'
import { useNavigate } from 'react-router-dom';
import styles from './LobbyClosed.module.css';
import { FaHome } from 'react-icons/fa';

const LobbyClosed = () => {

    const navigate = useNavigate();
    return (
        <div className={styles.LobbyClosed}>
            <h1 className={styles.title}>This lobby has been closed or does not exist</h1>
            <div className={styles.buttons}>
                <button onClick={() => navigate('/')} className={styles.homeButton}>
                    <FaHome className={styles.icon}/>
                    <h2>Return to home</h2>
                </button>
                <button onClick={() => navigate('/create')} className={styles.createButton}>
                    <h2>Create a game</h2>
                </button>
            </div>
        </div>
        
    )
}

export default LobbyClosed;