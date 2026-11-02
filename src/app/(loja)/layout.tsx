import { StoreChrome } from "@/shared/ui/StoreChrome";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StoreChrome>{children}</StoreChrome>;
}
