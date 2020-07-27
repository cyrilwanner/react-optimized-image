import React from 'react';
import Img from 'react-optimized-image';

const imageName = 'image.png';

export default () => (
  <div>
    <Img src={require(`./${imageName}`)} webp />
  </div>
);
