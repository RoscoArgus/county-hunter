import React from 'react'
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {

    const navigate = useNavigate();

    return (
        <div className={styles.Home}>
            <form className={styles.instructions}>
                <h1 className={styles.title}>Welcome to County Hunter</h1>
                <input placeholder='Enter Game Code to Join' maxLength={8}/>
                <button onClick={() => navigate('/create')}>Create Game</button>
            </form>
        </div>
    )
}

export default Home;