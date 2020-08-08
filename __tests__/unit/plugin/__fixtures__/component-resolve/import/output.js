import React from 'react';
import { Svg } from 'react-optimized-image';
import Image from './image.svg';
export default () => (
  <div>
    <Svg rawSrc={require('./image.svg?include')} />
  </div>
);
