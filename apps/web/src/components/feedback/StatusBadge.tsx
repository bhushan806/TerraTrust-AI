import React from 'react';
import {
  ShieldCheck,
  FlaskConical,
  Clock,
  PieChart,
  Loader2,
  AlertOctagon,
  Ban,
  Cpu,
  UserCheck,
  Building2,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadgeVariant } from '@/types/ui';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  className = '',
  size = 'md',
  tooltip,
}) => {
  const getBadgeConfig = () => {
    switch (variant) {
      case 'PRODUCTION':
        return {
          defaultLabel: 'PRODUCTION',
          icon: <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]',
          roleDesc: 'Verified institutional production data',
        };
      case 'ILLUSTRATIVE':
        return {
          defaultLabel: 'ILLUSTRATIVE',
          icon: <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#F2F4F7] text-[#344054] border-[#D0D5DD] font-semibold',
          roleDesc: 'Illustrative assumption - not an official credit decision',
        };
      case 'STALE':
        return {
          defaultLabel: 'STALE',
          icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
          roleDesc: 'Data has exceeded operational refresh threshold',
        };
      case 'PARTIAL':
        return {
          defaultLabel: 'PARTIAL',
          icon: <PieChart className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#F4F3FF] text-[#5925DC] border-[#D9D6FE]',
          roleDesc: 'Some observations or evidence fields are incomplete',
        };
      case 'PENDING':
        return {
          defaultLabel: 'PENDING',
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />,
          classes: 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]',
          roleDesc: 'Processing in progress',
        };
      case 'FAILED':
        return {
          defaultLabel: 'FAILED',
          icon: <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
          roleDesc: 'Operation failed',
        };
      case 'PD_UNAVAILABLE':
        return {
          defaultLabel: 'PD UNAVAILABLE',
          icon: <Ban className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#F2F4F7] text-[#344054] border-[#98A2B3] font-semibold tracking-wide',
          roleDesc: 'Probability of default unavailable due to closed governance gate or incomplete evidence',
        };
      case 'MODEL_OUTPUT':
        return {
          defaultLabel: 'MODEL OUTPUT',
          icon: <Cpu className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]',
          roleDesc: 'Model-generated statistical prediction',
        };
      case 'USER_ASSUMPTION':
        return {
          defaultLabel: 'USER ASSUMPTION',
          icon: <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#F8FAF9] text-[#1F6B4F] border-[#A3D9C9]',
          roleDesc: 'User-entered manual assumption',
        };
      case 'BACKEND_AUTHORITATIVE':
        return {
          defaultLabel: 'BACKEND AUTHORITATIVE',
          icon: <Building2 className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
          roleDesc: 'Official backend-authoritative calculation',
        };
      case 'PROVIDER_UNAVAILABLE':
        return {
          defaultLabel: 'PROVIDER UNAVAILABLE',
          icon: <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]',
          roleDesc: 'External agronomic provider service is down',
        };
      case 'HEALTHY':
        return {
          defaultLabel: 'HEALTHY',
          icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5]',
          roleDesc: 'Service operational within SLA',
        };
      case 'HIGH_RISK':
        return {
          defaultLabel: 'HIGH RISK',
          icon: <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />,
          classes: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] font-bold',
          roleDesc: 'Elevated credit or climate vulnerability',
        };
      default:
        return {
          defaultLabel: variant,
          icon: null,
          classes: 'bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]',
          roleDesc: 'Status indicator',
        };
    }
  };

  const config = getBadgeConfig();
  const text = label || config.defaultLabel;

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3 py-1 gap-1.5 font-semibold'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.classes} ${sizeClasses} select-none ${className}`}
      title={tooltip || config.roleDesc}
      role="status"
      aria-label={`${text}: ${config.roleDesc}`}
    >
      {config.icon}
      <span>{text}</span>
    </span>
  );
};
