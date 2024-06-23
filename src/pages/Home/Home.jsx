import React from 'react'
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';

const Home = () => {

    const navigate = useNavigate();
    const  { username } = useUsername();

    return (
        <div className={styles.Home}>
            <form className={styles.instructions}>
                <h2>Username: {username ? username : ''}</h2>
                <h1 className={styles.title}>Welcome to County Hunter</h1>
                <input placeholder='Enter Game Code to Join' maxLength={16}/>
                <button onClick={() => navigate('/create')}>Create Game</button>
            </form>
        </div>
    )
}

export default Home;