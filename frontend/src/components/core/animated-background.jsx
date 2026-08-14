'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Children, cloneElement, isValidElement, useState } from 'react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  transition,
  enableHover = false,
}) {
  const [activeId, setActiveId] = useState(defaultValue);

  const handleSetActiveId = (id) => {
    setActiveId(id);
    onValueChange?.(id);
  };

  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;

    const id = child.props['data-id'];
    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(defaultValue),
        }
      : {
          onClick: () => handleSetActiveId(id),
        };

    return cloneElement(child, {
      key: index,
      className: cn('relative inline-flex', child.props.className),
      'data-checked': id === activeId ? 'true' : 'false',
      ...interactionProps,
      children: (
        <>
          <AnimatePresence initial={false}>
            {activeId === id && (
              <motion.div
                layoutId="animated-background"
                className={cn('absolute inset-0', className)}
                transition={transition}
                initial={{ opacity: defaultValue ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
          <span className="relative z-10">{child.props.children}</span>
        </>
      ),
    });
  });
}