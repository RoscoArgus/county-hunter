import React, { useState, useEffect } from 'react';
import styles from './Timer.module.css';
const Timer = React.memo(({ targetTime, onTimeLimitReached, score, event, eventTriggerTimeMS=0 }) => {
  const [eventTriggered, setEventTriggered] = useState(false);

  const calculateTimeLeft = () => {
    const difference = targetTime - Date.now();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      onTimeLimitReached(); // Trigger action when time limit is reached
      timeLeft = { hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft()); // Initial state based on calculation

  useEffect(() => {
    // Update timeLeft every second
    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      const difference = targetTime - Date.now();
      if (event && difference <= eventTriggerTimeMS && !eventTriggered) {
        setEventTriggered(true);
        event();
      }
    }, 1000);

    return () => clearInterval(timerId); // Clean up timer
  }, [targetTime]); // Re-run effect when targetTime changes

  useEffect(() => {
    // Immediately update timeLeft on mount or when targetTime changes
    setTimeLeft(calculateTimeLeft());
  }, [targetTime]); // Re-run effect when targetTime changes

  return (
    <div className={`${styles.Timer} ${(timeLeft.hours == 0 && timeLeft.minutes < 10) ? (timeLeft.minutes == 0 && !timeLeft.seconds < 60) ? styles.urgent : styles.warning : ''}`}>
      <div>Time left: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</div>
      {score!==undefined && <div>Score: {score}</div>}
    </div>
  );
});

export default Timer;
