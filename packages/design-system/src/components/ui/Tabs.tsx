import React, { useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills';
  className?: string;
}

export const Tabs = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className = '',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={`
        flex gap-1
        ${variant === 'default' 
          ? 'border-b border-[var(--color-border-subtle)]' 
          : 'bg-[var(--color-bg-inset)] p-1 rounded-[var(--radius-md)]'
        }
      `}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium
              transition-all
              ${variant === 'default'
                ? activeTab === tab.id
                  ? 'border-b-2 border-[var(--color-accent-primary)] text-[var(--color-text-primary)] -mb-[1px]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)]'
                : activeTab === tab.id
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] rounded-[var(--radius-sm)] shadow-[var(--shadow-bevel)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] rounded-[var(--radius-sm)]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeContent}
      </div>
    </div>
  );
};
