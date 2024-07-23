import React, { useEffect, useState } from 'react';
import styles from './GuessPrompt.module.css';
import { FaMapSigns, FaInfoCircle, FaCommentDots, FaCheck } from 'react-icons/fa'; // Import checkmark icon
import PlacesAutocomplete from '../PlacesAutocomplete/PlacesAutocomplete';

const GuessPrompt = ({ shown, guess, selectedTargetTools, targets, handlePlaceChanged, currentGuess, onHint, bounds }) => {
    const { selectedTargetId, setSelectedTargetId } = selectedTargetTools;

    const [showModal, setShowModal] = useState(false); // Add state for modal visibility
    const [hintDetails, setHintDetails] = useState(''); // Add state for hint details
    const [hintType, setHintType] = useState(''); // Add state for hint type
    const [currentTarget, setCurrentTarget] = useState(null); // Add state for current target
    const [submitted, setSubmitted] = useState(false); // Add state for guess submission

    const handleUseHint = (type, value) => {
        const target = targets.find(target => target.id === selectedTargetId);
        setHintType(type); // Set the hint type
        setHintDetails(target[type].content); // Set the hint details
        setShowModal(true); // Show the modal
        onHint(type, value, selectedTargetId); // Use the hint
    };

    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
    };

    // Function to check if a hint is used
    const isHintUsed = (type) => {
        if(!selectedTargetId) return false;
        const target = targets.find(target => target.id === selectedTargetId);
        if(type !== 'reviews')
            return target[type].isUsed;
        else
            return target.reviews.isUsed !== -1;
    };

    const handleGuess = () => {
        setSubmitted(true);
        guess();
    }

    useEffect(() => {
        const target = targets.find(target => target.id === selectedTargetId);
        setCurrentTarget(target);
    }, [selectedTargetId, targets]);

    return (
        <div className={`${styles.prompt} ${shown ? styles.shown : ''}`}>
            <div className={styles.options}>
                <h2>You are within the range!</h2>
                <h3>{selectedTargetId
                    ? `Location ${currentTarget?.index} (Value: ${currentTarget?.value})`
                    : 'No Target Selected'
                }
                </h3>
                <div>Hint: {targets.find(target => target.id === selectedTargetId)?.hint}</div>
                {targets.length > 1 && (
                <div>
                    <label>Select target to guess for:</label>
                    <select onChange={(e) => setSelectedTargetId(e.target.value)} value={selectedTargetId || ''}>
                    <option value="" disabled>Select target</option>
                    {targets.map(target => (
                        <option key={target.id} value={target.id}>Location {target.index}</option>
                    ))}
                    </select>
                </div>
                )}
                <div className={styles.input}>
                    <PlacesAutocomplete
                        type='target'
                        handlePlaceChanged={handlePlaceChanged}
                        bounds={bounds}
                        submittedTools = {{submitted, setSubmitted}}
                    />
                    <button onClick={handleGuess} disabled={!currentGuess}>Guess the location</button>
                </div>
                <div>{currentGuess ? currentGuess.name : 'No Location Selected'}</div>
            </div>
            <ul className={styles.hints}>
                <li onClick={() => handleUseHint('street', true)}>
                    <div className={`${styles.icon} ${styles['street-name']}`}>
                        <FaMapSigns />
                        {isHintUsed('street') && <FaCheck className={styles.checkmark} />} {/* Show checkmark if used */}
                    </div>
                    <label>Street Name <br/>(-10 points)</label>
                </li>
                <li onClick={() => handleUseHint('types', true)}>
                    <div className={`${styles.icon} ${styles['establishment-types']}`}>
                        <FaInfoCircle />
                        {isHintUsed('types') && <FaCheck className={styles.checkmark} />} {/* Show checkmark if used */}
                    </div>
                    <label>Establishment Types <br/>(-10 points)</label>
                </li>
                <li onClick={() => handleUseHint('reviews', 0)}>
                    <div className={`${styles.icon} ${styles['random-review']}`}>
                        <FaCommentDots />
                        {isHintUsed('reviews') && <FaCheck className={styles.checkmark} />} {/* Show checkmark if used */}
                    </div>
                    <label>Random Review <br/>(-20 points)</label>
                </li>
            </ul>

            {/* Modal JSX */}
            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <span className={styles.close} onClick={handleCloseModal}>&times;</span>
                        <p>{`Hint: ${hintType!=='reviews' ? hintDetails : hintDetails[0].text}`}</p>
                        {/* Additional modal content or instructions */}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GuessPrompt;
