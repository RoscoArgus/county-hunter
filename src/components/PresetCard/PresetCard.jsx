import React from 'react';
import styles from './PresetCard.module.css';
import { useAuth } from '../../context/AuthContext';
import { getColorFromName } from '../../utils/user';

const PresetCard = ({ data, onPresetPress, selectedId }) => {

    const { currentUser } = useAuth();

    const getBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return 'red';
        } else if (data.creator === currentUser.displayName) {
            return 'blue';
        } else {
            return 'darkgray';
        }
    };

    const getHoverBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return 'darkred';
        } else if (data.creator === currentUser.displayName) {
            return 'darkblue';
        } else {
            return 'gray';
        }
    };

    const reduceToInitials = (str) => {
        return str
          .split(' ')
          .map(word => word[0].toUpperCase())
          .join('');
    };

    return (
        <button 
            className={styles.button} 
            style={{ border: selectedId === data.id ? '5px solid black' : 'none' }} 
            onClick={() => onPresetPress(data)}
        >
            <div className={styles.thumbnail}>
                {data?.thumbnail 
                ? <img src={data.thumbnail} alt={data.title} />
                : 
                <div className={styles.noThumbnail} style={{backgroundColor: getColorFromName(data.id)}}>
                    <h1>{reduceToInitials(data.title)}</h1>
                </div>
                }
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