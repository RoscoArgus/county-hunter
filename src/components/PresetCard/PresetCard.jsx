import React, { useState, useEffect } from 'react';
import styles from './PresetCard.module.css';
import { useAuth } from '../../context/AuthContext';
import { getColorFromName } from '../../utils/user';
import { FaInfo } from 'react-icons/fa';
import { preloadImage } from '../../utils/image';

const PresetCard = ({ data, onPresetPress, selected, toggleDetails, hasIssues }) => {

    const { currentUser } = useAuth();
    const [imageLoading, setImageLoading] = useState(true);

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

    useEffect(() => {
        if (data.thumbnail) {
            Promise.resolve(preloadImage(data.thumbnail)).then(setImageLoading(false));
        }
        else {
            setImageLoading(false);
        }
    }, [data.thumbnail]);

    return (
        <div className={styles.card}>
            {imageLoading && <h2>Loading...</h2>}
            {!imageLoading && <>
            {selected && <button className={`${styles.infoButton} ${hasIssues ? styles.issue : ''}`} onClick={toggleDetails}>
                <FaInfo className={styles.icon} />
            </button>}
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
            </>}
        </div>
    );
}

export default PresetCard;