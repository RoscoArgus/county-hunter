import React from 'react';
import styles from './PresetCard.module.css';
import { useUsername } from '../../context/UsernameContext';

const PresetCard = ({ data, onPresetPress, selectedId }) => {
    const username = useUsername();

    const getBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return 'red';
        } else if (data.creator === username) {
            return 'blue';
        } else {
            return 'darkgray';
        }
    };

    const getHoverBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return 'darkred';
        } else if (data.creator === username) {
            return 'darkblue';
        } else {
            return 'gray';
        }
    };

    return (
        <button 
            className={styles.button} 
            style={{ border: selectedId === data.id ? '5px solid black' : 'none' }} 
            onClick={() => onPresetPress(data)}
        >
            <div className={styles.thumbnail}>
                <img src={data.thumbnail} alt={data.title} />
            </div>
            <div 
                className={styles.title} 
                style={{
                    '--bg-color': getBackgroundColor(),
                    '--hover-bg-color': getHoverBackgroundColor(),
                }}
            >
                <h4>{data.title}</h4>
            </div>
        </button>
    );
}

export default PresetCard;