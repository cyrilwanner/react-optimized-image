import React from 'react';
import { StyledSvg } from './styles.js';
import SvgImage from './image.svg';
export default () => (
  <div>
    <StyledSvg src={require('./image.svg?include')} />
  </div>
);
