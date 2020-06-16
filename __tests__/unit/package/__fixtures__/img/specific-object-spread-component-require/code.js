import React from 'react';

const { Img } = require('react-optimized-image');

export default () => (
  <div>
    <Img src={require('./image.jpg')} webp />
  </div>
);
