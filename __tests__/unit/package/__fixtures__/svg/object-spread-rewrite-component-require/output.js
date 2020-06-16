import React from 'react';

const { Svg: Icon } = require('react-optimized-image');

export default () => (
  <div>
    <Icon src={require('./image.svg?include')} />
  </div>
);
