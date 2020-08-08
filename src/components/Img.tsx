import React, { ReactElement, DetailedHTMLProps, ImgHTMLAttributes, CSSProperties } from 'react';
import { ImgSrc } from './types';

export interface ImgProps
  extends Omit<Omit<DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, 'sizes'>, 'src'> {
  src: ImgSrc;
  type?: string;
  webp?: boolean;
  inline?: boolean;
  url?: boolean;
  original?: boolean;
  sizes?: number[];
  densities?: number[];
  breakpoints?: number[];
}
interface ImgInnerProps {
  rawSrc: {
    fallback: Record<number | string, Record<number, ImgSrc>>;
    webp?: Record<number | string, Record<number, ImgSrc>>;
  };
}

const buildSrcSet = (densities: Record<number, ImgSrc>): string => {
  return ((Object.keys(densities) as unknown) as number[])
    .map((density) => {
      if (`${density}` === '1') {
        return densities[density].src;
      }

      return `${densities[density].src} ${density}x`;
    })
    .join(', ');
};

const getImageType = (densities: Record<number, ImgSrc>): string => {
  const keys = (Object.keys(densities) as unknown) as number[];
  return densities[keys[keys.length - 1]].format;
};

const buildSources = (
  type: Record<number | string, Record<number, ImgSrc>>,
  sizes: Array<number | string>,
  breakpoints?: number[],
): ReactElement[] => {
  return sizes.map((size, i) => {
    const densities = type[size];
    const imageType = `image/${getImageType(densities)}`;
    let media;

    if (size === 'original' || sizes.length === 0 || !breakpoints || i > breakpoints.length) {
      // only one size
      media = undefined;
    } else if (i === 0) {
      // first size
      media = `(max-width: ${breakpoints[i]}px)`;
    } else if (i === sizes.length - 1) {
      // last size
      media = `(min-width: ${breakpoints[i - 1] + 1}px)`;
    } else {
      media = `(min-width: ${breakpoints[i - 1] + 1}px) and (max-width: ${breakpoints[i]}px)`;
    }

    return <source key={`${imageType}/${size}`} type={imageType} srcSet={buildSrcSet(densities)} media={media} />;
  });
};

const findFallbackImage = (src: ImgSrc, rawSrc: ImgInnerProps['rawSrc']): ImgSrc => {
  let fallbackImage = src;

  if (rawSrc.fallback) {
    const biggestSize = Object.keys(rawSrc.fallback)
      .map((key) => parseInt(key, 10))
      .sort((a, b) => b - a)
      .find(() => true);

    if (biggestSize) {
      const lowestDensity = Object.keys(rawSrc.fallback[biggestSize])
        .map((key) => parseInt(key, 10))
        .sort((a, b) => a - b)
        .find(() => true);

      if (lowestDensity) {
        fallbackImage = rawSrc.fallback[biggestSize][lowestDensity];
      }
    }
  }

  return fallbackImage;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const Img = ({
  src,
  type,
  webp,
  inline,
  url,
  original,
  sizes,
  densities,
  breakpoints,
  style,
  ...props
}: ImgProps): ReactElement | null => {
  const styles: CSSProperties = { ...(style || {}) };
  const { rawSrc, ...imgProps } = props as ImgInnerProps;

  if (!rawSrc) {
    throw new Error(
      "Babel plugin 'react-optimized-image/plugin' not installed or this component could not be recognized by it.",
    );
  }

  // find fallback image
  const fallbackImage = findFallbackImage(src, rawSrc);

  // return normal image tag if only 1 version is needed
  if (
    !rawSrc.webp &&
    Object.keys(rawSrc.fallback).length === 1 &&
    Object.keys(rawSrc.fallback[(Object.keys(rawSrc.fallback)[0] as unknown) as number]).length === 1
  ) {
    return <img src={fallbackImage.toString()} {...imgProps} style={styles} />;
  }

  return (
    <picture>
      {rawSrc.webp &&
        buildSources(
          rawSrc.webp,
          sizes || ((Object.keys(rawSrc.webp) as unknown) as (number | string)[]),
          breakpoints || sizes,
        )}
      {buildSources(
        rawSrc.fallback,
        sizes || ((Object.keys(rawSrc.fallback) as unknown) as (number | string)[]),
        breakpoints || sizes,
      )}
      <img src={fallbackImage.toString()} {...imgProps} style={styles} />
    </picture>
  );
};

export default Img;
