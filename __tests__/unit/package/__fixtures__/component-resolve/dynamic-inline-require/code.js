import React from 'react';
import Img, { Svg } from 'react-optimized-image';

const imageName = 'image';

export default () => (
  <div>
    <Svg src={require('./' + imageName + '.svg')} />
    <Img src={require('./' + imageName + '.png')} webp />
  </div>
);
