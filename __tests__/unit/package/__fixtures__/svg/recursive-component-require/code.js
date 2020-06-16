import React from 'react';

const { Svg } = require('react-optimized-image');

const ProxySvg = Svg;
const Icon = ProxySvg;

export default () => (
  <div>
    <Icon src={require('./image.svg')} />
  </div>
);
