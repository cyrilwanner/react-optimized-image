import React from 'react';

const { default: Img } = require('react-optimized-image');

export default () => (
  <div>
    <Img src={require('./image.jpg')} webp />
  </div>
);
