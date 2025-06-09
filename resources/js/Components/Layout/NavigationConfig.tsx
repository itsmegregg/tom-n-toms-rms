import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Percent,
  CreditCard,
  Clock,
  FileText,
  Ban,
  Users,
  Archive,
  File,
} from "lucide-react";

export interface MenuItem {
  title: string;
  route: string;
  icon: any;
}

export interface SubMenuItem extends MenuItem {}

export interface MenuItemWithSub extends Omit<MenuItem, 'route'> {
  items: SubMenuItem[];
}

export type NavigationItem = MenuItem | MenuItemWithSub;

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    route: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Item Sales",
    icon: ShoppingCart,
    items: [
      {
        title: "Per Items",
        route: "item-sales/per-items",
        icon: File,
      },
      {
        title: "Per Category",
        route: "item-sales/per-category",
        icon: File,
      }
    ]
  },
  {
    title: "Daily Sales",
    route: "daily-sales",
    icon: Calendar,
  },
  {
    title: "Discount",
    route: "discount",
    icon: Percent,
  },
  {
    title: "Payment",
    route: "payment",
    icon: CreditCard,
  },
  {
    title: "Hourly",
    route: "hourly",
    icon: Clock,
  },
  {
    title: "BIR Report",
    icon: FileText,
    items: [
      {
        title: "BIR Detailed",
        route: "bir-detailed",
        icon: FileText,
      },
      {
        title: "BIR Summary",
        route: "bir-summary",
        icon: FileText,
      },
    ],
  },
  {
    title: "Goverment Discount",
    route: "government-discount",
    icon: FileText,
  },
  {
    title:"Void Tx",
    route: "void-tx",	
    icon:  Ban
  },
  {
    title: "Cashier",
    route: "cashier-report",
    icon: Users,
  },
  {
    title: "Fast Moving item",
    route: "fast-moving-item",	
    icon:  Archive
  }
];
