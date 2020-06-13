import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png';

export default () => (
  <div>
    <Img src={Image} webp />
  </div>
);
