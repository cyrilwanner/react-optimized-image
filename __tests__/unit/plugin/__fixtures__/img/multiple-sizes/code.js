import React from 'react';
import Img from 'react-optimized-image';
import Image from './image.png?original';

export default () => (
  <div>
    <Img src={Image} sizes={[400, 800]} />
  </div>
);
