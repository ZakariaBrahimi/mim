import {
  Smartphone,
  Handshake,
  CreditCard,
  ShieldCheck,
  Users,
  Store,
  Settings2,
  Globe,
  Landmark,
  Layers,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Handshake,
  CreditCard,
  ShieldCheck,
  Users,
  Store,
  Settings2,
  Globe,
  Landmark,
  Layers,
};

export function ProductIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICONS[name] ?? Smartphone;
  return <Icon className={className} style={style} />;
}
