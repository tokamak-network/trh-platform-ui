import * as React from "react";

export const SecurityItemIcon: React.FC<
  { isSelected?: boolean } & React.SVGProps<SVGSVGElement>
> = ({ isSelected, ...props }) => {
  if (isSelected) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.99344 1.48654L3.66677 2.73988C2.9001 3.02654 2.27344 3.93321 2.27344 4.74654V9.69988C2.27344 10.4865 2.79344 11.5199 3.42677 11.9932L6.29344 14.1332C7.23344 14.8399 8.7801 14.8399 9.7201 14.1332L12.5868 11.9932C13.2201 11.5199 13.7401 10.4865 13.7401 9.69988V4.74654C13.7401 3.92654 13.1134 3.01988 12.3468 2.73321L9.0201 1.48654C8.45344 1.27988 7.54677 1.27988 6.99344 1.48654Z"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.03125 7.91345L7.10458 8.98678L9.97125 6.12012"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.99344 1.48654L3.66677 2.73988C2.9001 3.02654 2.27344 3.93321 2.27344 4.74654V9.69988C2.27344 10.4865 2.79344 11.5199 3.42677 11.9932L6.29344 14.1332C7.23344 14.8399 8.7801 14.8399 9.7201 14.1332L12.5868 11.9932C13.2201 11.5199 13.7401 10.4865 13.7401 9.69988V4.74654C13.7401 3.92654 13.1134 3.01988 12.3468 2.73321L9.0201 1.48654C8.45344 1.27988 7.54677 1.27988 6.99344 1.48654Z"
        stroke="#6D758F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.03125 7.91345L7.10458 8.98678L9.97125 6.12012"
        stroke="#6D758F"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
