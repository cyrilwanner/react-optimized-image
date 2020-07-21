import React from 'react';

const Icon = require('react-optimized-image').Svg;
const Img = require('react-optimized-image').default;

export default () => (
  <div>
    <Icon src={require('./image.svg')} />
    <Img src={require('./image.png')} sizes={[400, 800]} />
  </div>
);
