import React from 'react';

const { Svg } = require('react-optimized-image');

export default () => (
  <div>
    <Svg src={require('./image.svg?include')} />
  </div>
);
