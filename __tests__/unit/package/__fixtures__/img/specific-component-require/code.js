import React from 'react';

const { default: Image } = require('react-optimized-image/lib/components/Img');

export default () => (
  <div>
    <Image src={require('./image.jpg')} webp />
  </div>
);
