import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types/ui';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb navigation" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            to="/"
            className="text-neutral-500 hover:text-neutral-800 flex items-center focus:outline-none focus:ring-1 focus:ring-primary-700 rounded px-1"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Dashboard Home</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="font-medium text-neutral-800 truncate max-w-[200px]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-neutral-500 hover:text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-700 rounded px-1 truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
