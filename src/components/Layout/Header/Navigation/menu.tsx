export interface HeaderItem {
  label: string;
  href: string;
  submenu?: {
    label: string;
    href: string;
  }[];
}
