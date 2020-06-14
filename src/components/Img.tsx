import React, { ReactElement, DetailedHTMLProps, ImgHTMLAttributes, CSSProperties } from 'react';

export interface ImgSrc {
  src: string;
  width: number;
  height: number;
  format: string;
  toString(): string;
}

export interface ImgProps
  extends Omit<Omit<DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, 'sizes'>, 'src'> {
  src: ImgSrc;
  webp?: boolean;
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
  breakpoints?: number[],
): ReactElement[] => {
  const sizes = (Object.keys(type) as unknown) as (number | string)[];

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

const Img = ({ src, webp, sizes, densities, breakpoints, style, ...props }: ImgProps): ReactElement | null => {
  const styles: CSSProperties = { ...(style || {}) };
  const { rawSrc, ...imgProps } = props as ImgInnerProps;

  // return normal image tag if only 1 version is needed
  if (
    !rawSrc.webp &&
    Object.keys(rawSrc.fallback).length === 1 &&
    Object.keys(rawSrc.fallback[(Object.keys(rawSrc.fallback)[0] as unknown) as number]).length === 1
  ) {
    return <img src={src.src} {...imgProps} style={styles} />;
  }

  return (
    <picture>
      {rawSrc.webp && buildSources(rawSrc.webp, breakpoints)}
      {buildSources(rawSrc.fallback, breakpoints)}
      <img src={src.src} {...imgProps} style={styles} />
    </picture>
  );
};

export default Img;
