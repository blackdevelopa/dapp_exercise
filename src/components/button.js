import React from "react";
import './styles.css';

export const Button = ({text, onClick, disable, loading}) => {
    return (
        <>
            {loading ? <button className='button' disabled>{text}</button> : disable ? <button className='disabled_button' disabled>{text}</button> : <button className='button' onClick={onClick}>{text}</button>}
        </>

    );
}