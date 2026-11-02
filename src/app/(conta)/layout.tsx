import { StoreChrome } from "@/shared/ui/StoreChrome";

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StoreChrome>{children}</StoreChrome>;
}
