import React from 'react';
import styles from './PresetCard.module.css';
import { useAuth } from '../../context/AuthContext';
import { getColorFromName } from '../../utils/user';

const PresetCard = ({ data, onPresetPress, selected }) => {

    const { currentUser } = useAuth();

    const getBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return '#FF4343';
        } else if (data.creator === currentUser.displayName) {
            return '#3C6CFD';
        } else {
            return '#00BA4D';
        }
    };

    const getHoverBackgroundColor = () => {
        if (data.creator === 'County Hunter') {
            return '#D80000';
        } else if (data.creator === currentUser.displayName) {
            return '#1E3888';
        } else {
            return '#009A40';
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
            style={{ border: selected ? '4px solid #FFD117' : '' }} 
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