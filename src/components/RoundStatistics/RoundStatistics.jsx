import React, { useState, useEffect } from 'react'
import styles from './RoundStatistics.module.css';

const RoundStatistics = ({players=[]}) => {

    const [playerRoundInfo, setPlayerRoundInfo] = useState([]);

    useEffect(() => {
        let newPlayerRoundInfo = players.sort((a, b) => {
            // First, compare scores in descending order
            if (b[1].score !== a[1].score) {
              return b[1].score - a[1].score;
            }
            // If scores are equal, compare timestamps in ascending order
            return a[1].completionTime - b[1].completionTime;
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
                        <th>Time</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {playerRoundInfo.length > 0 
                        ? playerRoundInfo.map(([userId, player]) => (
                            <tr key={userId}>
                                <td>{player?.username.slice(0,12) + (player?.username.length > 12 ? '...' : '')}</td>
                                <td>{player?.completionTime ? convertMsToTime(player.completionTime) : 'N/A'}</td>
                                <td className={styles.score}>{player?.score ? player.score : 'N/A'}</td>
                            </tr>
                        ))
                        : <tr>
                            <td colSpan={1}>No Players</td>
                            <td colSpan={1}>...</td>
                            <td colSpan={1}>...</td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    )
}

export default RoundStatistics
