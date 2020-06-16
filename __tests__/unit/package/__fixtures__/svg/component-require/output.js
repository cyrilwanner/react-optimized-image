import React from 'react';

const Icon = require('react-optimized-image').Svg;

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
  </div>
);
