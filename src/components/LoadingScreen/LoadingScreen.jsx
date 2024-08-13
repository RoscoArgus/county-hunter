import React from 'react'
import Spinner from '../Spinner/Spinner'
import styles from './LoadingScreen.module.css'

const LoadingScreen = () => {
  return (
    <div className={styles.LoadingScreen}>
      <Spinner />
    </div>
  )
}

export default LoadingScreen
