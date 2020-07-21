import React from 'react';
import { Svg } from 'react-optimized-image';
import Image from './image.svg';
export default () => (
  <div>
    <Svg src={require('./image.svg?include')} />
  </div>
);
