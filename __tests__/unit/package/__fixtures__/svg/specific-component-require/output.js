import React from 'react';

const { default: Icon } = require('react-optimized-image/lib/components/Svg');

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
  </div>
);
