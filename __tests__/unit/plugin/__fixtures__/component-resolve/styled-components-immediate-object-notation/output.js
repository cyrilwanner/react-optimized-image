import React from 'react';
import { Svg } from 'react-optimized-image';
import styled from 'styled-components';
import Image from './image.svg';
const styles = {
  StyledSvg: styled(Svg)`
    background-color: red;
  `,
};
export default () => (
  <div>
    <styles.StyledSvg src={require('./image.svg?include')} />
  </div>
);
