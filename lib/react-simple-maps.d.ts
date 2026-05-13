declare module "react-simple-maps" {
  import * as React from "react";

  export interface GeographiesProps {
    geography: string;
    children: (props: { geographies: GeoFeature[] }) => React.ReactNode;
  }
  export interface GeoFeature {
    rsmKey: string;
    [key: string]: unknown;
  }
  export interface GeographyProps {
    geography: GeoFeature;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: { default?: React.CSSProperties; hover?: React.CSSProperties; pressed?: React.CSSProperties };
    [key: string]: unknown;
  }
  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
}
