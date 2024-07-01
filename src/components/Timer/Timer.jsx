import React, { useState, useEffect } from 'react';

const Timer = React.memo(({ targetTime, onTimeLimitReached }) => {
  const calculateTimeLeft = () => {
    const difference = targetTime - Date.now() + 14 * 1000;
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
    }, 1000);

    return () => clearInterval(timerId); // Clean up timer
  }, [targetTime]); // Re-run effect when targetTime changes

  useEffect(() => {
    // Immediately update timeLeft on mount or when targetTime changes
    setTimeLeft(calculateTimeLeft());
  }, [targetTime]); // Re-run effect when targetTime changes

  return (
    <div>
      <p>Time left: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</p>
    </div>
  );
});

export default Timer;
