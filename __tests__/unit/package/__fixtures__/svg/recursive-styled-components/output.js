import React from 'react';
import { Svg } from 'react-optimized-image';
import styled from 'styled-components';
import Image from './image.svg';
const StyledSvg = styled(Svg)`
  background-color: red;
`;
const StyledIcon = styled(StyledSvg)`
  font-size: 16px;
`;
export default () => (
  <div>
    <StyledIcon src={require('./image.svg?include')} />
  </div>
);
