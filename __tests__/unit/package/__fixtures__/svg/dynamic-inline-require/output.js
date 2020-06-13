import React from 'react';
import { Svg } from 'react-optimized-image';
const imageName = 'image';
export default () => (
  <div>
    <Svg src={require('./' + imageName + '.svg?include')} />
  </div>
);
