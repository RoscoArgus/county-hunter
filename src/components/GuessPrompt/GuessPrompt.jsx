import React from 'react'
import styles from './GuessPrompt.module.css'
import PlacesAutocomplete from '../PlacesAutocomplete/PlacesAutocomplete';

const GuessPrompt = ({ shown, guess, selectedTargetTools, targets, handlePlaceChanged, bounds }) => {
    const { selectedTargetId, setSelectedTargetId } = selectedTargetTools;
    return (
        <div className={`${styles.prompt} ${shown ? '' : styles.hidden}`}>
            {shown && (
            <>
                <h2>You are within the range!</h2>
                {targets.length > 1 && (
                <div>
                    <label>Select target to guess for:</label>
                    <select onChange={setSelectedTargetId} value={selectedTargetId || ''}>
                    <option value="" disabled>Select target</option>
                    {targets.map(target => (
                        <option key={target.id} value={target.id}>{target.id.slice(-4)}</option>
                    ))}
                    </select>
                </div>
                )}
                <PlacesAutocomplete
                    type='target'
                    handlePlaceChanged={handlePlaceChanged}
                    bounds={bounds}
                />
                <button onClick={() => guess()} disabled={!selectedTargetId}>Guess the location</button>
                <div>Hint: {targets.find(target => target.id === selectedTargetId)?.hint}</div>
                <div>Street: {targets.find(target => target.id === selectedTargetId)?.street}</div>
                <div>Types: {targets.find(target => target.id === selectedTargetId)?.types.map((type, index) => {
                        return type + ' '
                    })}
                </div>
                <div>Reviews: {targets.find(target => target.id === selectedTargetId)?.reviews?.map((review) => {
                        return <div key={review.text}>Rating: {review.rating} Review: {review.text}</div>
                    })}
                </div>
            </>
            )}
        </div>
    )
}

export default GuessPrompt