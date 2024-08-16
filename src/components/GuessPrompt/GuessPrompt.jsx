import React, { useEffect, useState } from 'react';
import styles from './GuessPrompt.module.css';
import { FaMapSigns, FaInfoCircle, FaCommentDots, FaCheck } from 'react-icons/fa'; // Import checkmark icon
import PlacesAutocomplete from '../PlacesAutocomplete/PlacesAutocomplete';
import { getDistanceInMeters } from '../../utils/calculations';

const GuessPrompt = ({ shown, guess, selectedTargetTools, targets, handlePlaceChanged, currentGuess, onHint, bounds, startingLocation, endGame }) => {
    const { selectedTargetId, setSelectedTargetId } = selectedTargetTools;

    const [showModal, setShowModal] = useState(false); // Add state for modal visibility
    const [hintDetails, setHintDetails] = useState(''); // Add state for hint details
    const [hintType, setHintType] = useState(''); // Add state for hint type
    const [currentTarget, setCurrentTarget] = useState(null); // Add state for current target
    const [submitted, setSubmitted] = useState(false); // Add state for guess submission
    const [selectedReviewIndex, setSelectedReviewIndex] = useState(null); // Add state for selected review index

    const hintTypes = [
        { type: 'street', usedValue: true, title: 'Street Name', icon: <FaMapSigns /> },
        { type: 'types', usedValue: true, title: 'Establishment Types', icon: <FaInfoCircle /> },
        { type: 'reviews', usedValue: 0, title: 'Random Review', icon: <FaCommentDots />}
    ];

    const handleUseHint = (type, usedValue, hintValue) => {
        const target = targets.find(target => target.id === selectedTargetId);
        setHintType(type); // Set the hint type
        if (type === 'reviews') {
            if (target.reviews.isUsed === -1) {
                setHintDetails(target[type]); // Set the hint details
                setShowModal(true); // Show the modal
            } else {
                setSelectedReviewIndex(target.reviews.isUsed); // Set the selected review index
                setHintDetails(target.reviews.content[target.reviews.isUsed]); // Set the hint details to the selected review
                onHint(type, usedValue, hintValue, selectedTargetId); // Use the hint
                setShowModal(true); // Show the modal
            }
        } else {
            setHintDetails(target[type].content); // Set the hint details
            setShowModal(true); // Show the modal
            onHint(type, usedValue, hintValue, selectedTargetId); // Use the hint
        }
    };

    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
        setSelectedReviewIndex(null); // Reset the selected review index
    };

    const handleSelectReview = (index) => {
        const target = targets.find(target => target.id === selectedTargetId);
        setSelectedReviewIndex(index);
        setHintDetails(target.reviews.content[index]);
        onHint(hintType, index, 5 + (target.reviews.content.length > 2 ? 5 * (target.reviews.content.length - 2) : 0), selectedTargetId);
    };

    const isGuessInRange = () => {
        return getDistanceInMeters(
            currentGuess?.latitude,
            currentGuess?.longitude,
            startingLocation?.location.latitude,
            startingLocation?.location.longitude
        ) < startingLocation.radius;
    }

    // Function to check if a hint is used
    const isHintUsed = (type) => {
        if (!selectedTargetId) return false;
        const target = targets?.find(target => target.id === selectedTargetId);
        if (!target) return false;
        if (type !== 'reviews')
            return target[type].isUsed;
        else
            return target.reviews.isUsed !== -1;
    };

    const handleGuess = () => {
        setSubmitted(true);
        guess();
    };

    useEffect(() => {
        const target = targets?.find(target => target.id === selectedTargetId);
        setCurrentTarget(target);
    }, [selectedTargetId, targets]);

    return (
        <div className={`${styles.prompt} ${shown ? styles.shown : ''}`}>
            {targets ? <React.Fragment>
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
                            submittedTools={{ submitted, setSubmitted }}
                        />
                        <button onClick={handleGuess} disabled={!currentGuess || !isGuessInRange()}>Guess the location</button>
                    </div>
                    <div>{currentGuess ? currentGuess.name : 'No Location Selected'}</div>
                </div>
                <ul className={styles.hints}>
                    {hintTypes.map((item, _) => {
                        const target = targets?.find(target => target.id === selectedTargetId);
                        const disabled = target ? !(target[item.type]?.content ?? false) : true;
                        let hintValue = (item.type === 'street'
                        ? 10
                        : item.type === 'reviews'
                            ? 5 + (target?.reviews?.content?.length > 2 ? 5 * (target?.reviews?.content?.length - 2) : 0)
                            : item.type === 'types'
                                ? target?.types.content?.length > 1 ? 10 : 5
                                : 0
                        );

                        return (
                        <button key={item.type} disabled={disabled} onClick={() => handleUseHint(item.type, item.usedValue, hintValue)}>
                            <div className={`${styles.icon} ${styles[item.type]} ${disabled ? styles.disabled : ''}`}>
                            {item.icon}
                            {isHintUsed(item.type) && 
                                <div className={styles.checkmark}>
                                    <FaCheck />
                                </div>
                            }
                            </div>
                            <label>
                                {item.title} <br/>
                                {disabled ? "(Disabled)" : isHintUsed(item.type) ? "(Used)" : <>({hintValue ? '-' : ''}{hintValue} points)</>}
                            </label>
                        </button>
                        );
                    })}
                </ul>
                {/* Modal JSX */}
                {showModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <span className={styles.close} onClick={handleCloseModal}>&times;</span>
                            {hintType === 'reviews' ? (
                                selectedReviewIndex === null ? (
                                    <div>
                                        <p>Select a review:</p>
                                        <ul>
                                            {hintDetails?.content?.map((review, index) => (
                                                <li key={index} onClick={() => handleSelectReview(index)}>
                                                    Review {index + 1}: Rating - {review.rating}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <React.Fragment>
                                        <h2>Review</h2>
                                        <h3>Rating: </h3> {hintDetails.rating}
                                        <h3>Content: </h3> {hintDetails.text}
                                    </React.Fragment>
                                )
                            ) : (
                                <React.Fragment>
                                    <h2>{Array.isArray(hintDetails) ? "Establishment Types" : "Street Name"}</h2>
                                    {Array.isArray(hintDetails) 
                                        ?   
                                        <>
                                            {hintDetails.map((item) => {
                                                return <h3>{item.replaceAll("_", " ")}</h3>})}
                                        </>
                                        : 
                                        <>
                                            {hintDetails}
                                        </>
                                    }
                                    
                                </React.Fragment>
                            )}
                            {/* Additional modal content or instructions */}
                        </div>
                    </div>
                )}
            </React.Fragment>
            : <button onClick={endGame} className={styles.endButton}>End Game</button>}
        </div>
    );
};

export default GuessPrompt;
