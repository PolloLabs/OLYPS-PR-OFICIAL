import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SidebarSubItem } from './SidebarSubItem.js';
import type {
  SidebarMenuItem as SidebarMenuItemType,
  SidebarSubItem as SidebarSubItemType,
} from '../../types/navigation.types.js';

interface SidebarItemProps {
  item: SidebarMenuItemType;
  isActive: boolean;
  activeSubItemId?: string;
  isExpanded: boolean;
  isCollapsedSidebar: boolean;
  onToggleExpand: (itemId: string) => void;
  onSelectMain: (item: SidebarMenuItemType) => void;
  onSelectSub: (item: SidebarSubItemType, parentItem: SidebarMenuItemType) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  activeSubItemId,
  isExpanded,
  isCollapsedSidebar,
  onToggleExpand,
  onSelectMain,
  onSelectSub,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const handleClick = () => {
    if (isCollapsedSidebar) {
      // If collapsed and clicked, select first child or self
      if (hasChildren && item.children && item.children.length > 0) {
        onSelectSub(item.children[0], item);
      } else {
        onSelectMain(item);
      }
      return;
    }

    if (hasChildren) {
      onToggleExpand(item.id);
    } else {
      onSelectMain(item);
    }
  };

  // When sidebar is collapsed
  if (isCollapsedSidebar) {
    return (
      <div
        className="relative flex justify-center w-full px-2 py-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          id={`collapsed-nav-btn-${item.id}`}
          type="button"
          onClick={handleClick}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            isActive
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label={item.label}
          title={item.label}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon className="w-5 h-5 shrink-0" />
        </button>

        {/* Floating Tooltip / Flyout Menu on Hover when collapsed */}
        {isHovered && (
          <div
            id={`flyout-tooltip-${item.id}`}
            className="absolute left-full top-0 ml-2 z-50 bg-slate-900 text-white text-xs rounded-lg shadow-xl py-2 px-3 min-w-[180px] max-w-[240px] pointer-events-auto border border-slate-700"
          >
            <div className="font-semibold text-slate-100 flex items-center space-x-1.5 pb-1 border-b border-slate-800">
              <Icon className="w-3.5 h-3.5 text-slate-300" />
              <span>{item.label}</span>
            </div>
            {item.description && (
              <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
            )}

            {hasChildren && item.children && (
              <div className="mt-2 pt-1 border-t border-slate-800 space-y-1">
                {item.children.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = activeSubItemId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSub(sub, item);
                        setIsHovered(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left text-[11px] transition-colors ${
                        isSubActive
                          ? 'bg-white/20 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <SubIcon className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded Sidebar item
  return (
    <div className="w-full space-y-1">
      <button
        id={`nav-item-${item.id}`}
        type="button"
        onClick={handleClick}
        className={`w-full group flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
          isActive && !hasChildren
            ? 'bg-slate-900 text-white font-semibold shadow-xs'
            : isActive && hasChildren
            ? 'bg-slate-100 text-slate-900 font-semibold'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
        }`}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-controls={hasChildren ? `submenu-${item.id}` : undefined}
        aria-label={item.label}
        aria-current={isActive && !hasChildren ? 'page' : undefined}
      >
        {/* Left: Icon + Label */}
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive && !hasChildren
                ? 'text-white'
                : isActive
                ? 'text-slate-900'
                : 'text-slate-500 group-hover:text-slate-800'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {/* Right: Badge and Chevron indicator */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {item.badge && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
              {item.badge}
            </span>
          )}

          {hasChildren && (
            <span className="text-slate-400 group-hover:text-slate-600">
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 transition-transform" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 transition-transform" />
              )}
            </span>
          )}
        </div>
      </button>

      {/* Submenu with visual indentation line */}
      {hasChildren && isExpanded && item.children && (
        <div
          id={`submenu-${item.id}`}
          className="ml-4 pl-3 border-l border-slate-200 space-y-1 py-0.5"
          role="region"
          aria-label={`Submenu ${item.label}`}
        >
          {item.children.map((subItem) => (
            <SidebarSubItem
              key={subItem.id}
              item={subItem}
              isActive={activeSubItemId === subItem.id}
              onSelect={(sub) => onSelectSub(sub, item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
