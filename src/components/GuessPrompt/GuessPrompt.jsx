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

    const hintTypes = [
        { type: 'street', value: 10, usedValue: true },
        { type: 'types', value: 10, usedValue: true },
        { type: 'reviews', value: 20, usedValue: 0}
    ]

    const handleUseHint = (type, usedValue, hintValue) => {
        const target = targets.find(target => target.id === selectedTargetId);
        setHintType(type); // Set the hint type
        setHintDetails(target[type].content); // Set the hint details
        setShowModal(true); // Show the modal
        onHint(type, usedValue, hintValue, selectedTargetId); // Use the hint
    };

    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
    };

    // Function to check if a hint is used
    const isHintUsed = (type) => {
        if(!selectedTargetId) return false;
        const target = targets?.find(target => target.id === selectedTargetId);
        if(!target) return false;
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
        const target = targets?.find(target => target.id === selectedTargetId);
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
                <div>Hint: {targets?.find(target => target.id === selectedTargetId)?.hint}</div>
                {targets?.length > 1 && (
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
                {hintTypes.map((item, _) => {
                    let hintValue = 0;
                    let disabled = false;
                    const target = targets.find(target => target.id === selectedTargetId);
                    switch(item.type) {
                        case 'street':
                            disabled = !target?.street;
                            hintValue = 10;
                            break;
                        case 'types':
                            disabled = !target?.types.length === 0;
                            hintValue = target?.types.content.length > 1 ? 10 : 5;
                            break;
                        case 'reviews':
                            disabled = !target?.reviews.length === 0;
                            hintValue = 20;
                            break;
                        default:
                            break;
                    }
                    
                    return (
                        <li onClick={() => handleUseHint(item.type, item.usedValue, hintValue)}>
                            <div className={`${styles.icon} ${styles[type]}`}>
                                <FaMapSigns />
                                {isHintUsed(type) && <FaCheck className={styles.checkmark} />} {/* Show checkmark if used */}
                            </div>
                            <label>Street Name <br/>(-{hintValue} points)</label>
                        </li>
                    );
                })}
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
