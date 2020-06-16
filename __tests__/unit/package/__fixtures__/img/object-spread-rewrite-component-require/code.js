import React from 'react';

const { Img: Image } = require('react-optimized-image');

export default () => (
  <div>
    <Image src={require('./image.jpg')} webp />
  </div>
);
