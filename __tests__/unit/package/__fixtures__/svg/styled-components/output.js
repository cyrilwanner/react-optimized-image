import React from 'react';
import { Svg } from 'react-optimized-image';
import styled from 'styled-components';
import Image from './image.svg';
const StyledSvg = styled(Svg)`
  background-color: red;
`;
export default () => (
  <div>
    <StyledSvg src={require('./image.svg?include')} />
  </div>
);
