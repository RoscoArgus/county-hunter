import React, { useRef } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import styles from './PresetSlider.module.css';
import PresetCard from '../PresetCard/PresetCard';

const PresetSlider = ({ slides, onPresetPress, selectedId }) => {
  const sliderRef = useRef(null);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    className: `${styles.slider}`,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  // This just helps prevent overscrolling glitching out and displaying no slides 
  // (i.e. scrolling 6 slides when there are only 3 bugs it out)
  const displaySlides = slides.length < 6 ? [...slides, ...slides] : slides;

  return (
    <div className={styles.sliderContainer}>
      <button className={styles.leftCaret} onClick={() => sliderRef.current.slickPrev()}>&lt;</button>
      <Slider ref={sliderRef} {...settings}>
        {displaySlides.map((d, index) => (
          <PresetCard key={index} data={d} onPresetPress={onPresetPress} selectedId={selectedId}/>
        ))}
      </Slider>
      <button className={styles.rightCaret} onClick={() => sliderRef.current.slickNext()}>&gt;</button>
    </div>
  );
};

export default PresetSlider;
