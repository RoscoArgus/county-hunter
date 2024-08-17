import React, { useState, useEffect } from 'react'
import styles from './RoundStatistics.module.css';

const RoundStatistics = ({players=[]}) => {

    const [playerRoundInfo, setPlayerRoundInfo] = useState([]);

    useEffect(() => {
        let newPlayerRoundInfo = players.sort((a, b) => {
            // First, compare scores in descending order
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            // If scores are equal, compare timestamps in ascending order
            return a.completionTime - b.completionTime;
        });

        setPlayerRoundInfo(newPlayerRoundInfo);
    }, [players]);

    function convertMsToTime(ms) {
        let seconds = Math.floor((ms / 1000) % 60);
        let minutes = Math.floor((ms / (1000 * 60)) % 60);
        let hours = Math.floor(ms / (1000 * 60 * 60));
    
        // Pad the minutes and seconds with leading zeros if necessary
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
    
        return `${hours}:${minutes}:${seconds}`;
    }

    return (
        <div className={styles.stats}>
            <h2>Previous Round:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {playerRoundInfo.map(([userId, player]) => (
                        <tr key={userId}>
                            <td>{player?.username}</td>
                            <td>{player?.score ? player.score : 'N/A'}</td>
                            <td>{player?.completionTime ? convertMsToTime(player.completionTime) : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default RoundStatistics
