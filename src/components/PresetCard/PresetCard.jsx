import React from 'react'
import styles from './PresetCard.module.css';

const PresetCard = ({ data }) => {
    return <div className={styles.card}>{data.name}</div>
}

export default PresetCard