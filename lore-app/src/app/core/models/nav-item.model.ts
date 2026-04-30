/**
 * Navigation item for the nav rail
 */
export interface NavItem {
  /** Unique identifier for the nav item */
  id: string;
  
  /** Material Symbols icon name */
  icon: string;
  
  /** Display label for the nav item */
  label: string;
  
  /** Route to navigate to (empty string = action, no navigation) */
  route: string;
  
  /** Optional badge count to display */
  badgeCount?: number;
}
