import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import styles from './PresetSlider.module.css';
import PresetCard from '../PresetCard/PresetCard';

const PresetSlider = ({ slides }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    className: `${styles.slider}`
  };

  return (
    <Slider {...settings}>
        {slides.map((d) => (
          <PresetCard key={d.id} data={d} />
        ))}
    </Slider>
  );
};

export default PresetSlider;
