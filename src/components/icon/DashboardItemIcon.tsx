import * as React from "react";

export const DashboardItemIcon: React.FC<
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
          d="M5.9987 14.6668H9.9987C13.332 14.6668 14.6654 13.3335 14.6654 10.0002V6.00016C14.6654 2.66683 13.332 1.3335 9.9987 1.3335H5.9987C2.66536 1.3335 1.33203 2.66683 1.33203 6.00016V10.0002C1.33203 13.3335 2.66536 14.6668 5.9987 14.6668Z"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6.66797 11.3332H9.33464C10.4346 11.3332 11.3346 10.4332 11.3346 9.33317V6.6665C11.3346 5.5665 10.4346 4.6665 9.33464 4.6665H6.66797C5.56797 4.6665 4.66797 5.5665 4.66797 6.6665V9.33317C4.66797 10.4332 5.56797 11.3332 6.66797 11.3332Z"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M8 4.6665V11.3332"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4.66797 8H11.3346"
          stroke="white"
          stroke-linecap="round"
          stroke-linejoin="round"
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
        d="M5.9987 14.6668H9.9987C13.332 14.6668 14.6654 13.3335 14.6654 10.0002V6.00016C14.6654 2.66683 13.332 1.3335 9.9987 1.3335H5.9987C2.66536 1.3335 1.33203 2.66683 1.33203 6.00016V10.0002C1.33203 13.3335 2.66536 14.6668 5.9987 14.6668Z"
        stroke="#6D758F"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M6.66797 11.3332H9.33464C10.4346 11.3332 11.3346 10.4332 11.3346 9.33317V6.6665C11.3346 5.5665 10.4346 4.6665 9.33464 4.6665H6.66797C5.56797 4.6665 4.66797 5.5665 4.66797 6.6665V9.33317C4.66797 10.4332 5.56797 11.3332 6.66797 11.3332Z"
        stroke="#6D758F"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 4.6665V11.3332"
        stroke="#6D758F"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M4.66797 8H11.3346"
        stroke="#6D758F"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
