import React, { memo } from 'react'
import Spinner from '../Spinner/Spinner'
import styles from './LoadingScreen.module.css'

const LoadingScreen = memo(() => {
  return (
    <div className={styles.LoadingScreen}>
      <Spinner />
    </div>
  )
});

export default LoadingScreen
