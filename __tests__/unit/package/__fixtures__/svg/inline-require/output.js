import React from 'react';
import { Svg } from 'react-optimized-image';
export default () => (
  <div>
    <Svg src={require('./image.svg?include')} />
  </div>
);
