import React, { memo } from 'react';
import styles from './Spinner.module.css';
import { FaGlobeEurope, FaRunning } from 'react-icons/fa';

const Spinner = memo(() => {
  return (
    <div className={styles.spinnerContainer}>
      <FaGlobeEurope className={styles.globe} />
      <div className={styles.orbit}>
        <FaRunning className={styles.plane} />
      </div>
    </div>
  );
});

export default Spinner;
