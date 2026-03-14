/**
 * Sidebar-specific animation configurations
 * 
 * Reusable animations for sidebar expand/collapse interactions.
 */

import type { AnimeParams } from 'animejs'

/**
 * Animation for sidebar labels when expanding
 * Slides in from left with fade-in
 */
export const sidebarLabelExpand: Partial<AnimeParams> = {
  translateX: [-10, 0],
  opacity: [0, 1],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Animation for sidebar labels when collapsing
 * Slides out to left with fade-out
 */
export const sidebarLabelCollapse: Partial<AnimeParams> = {
  translateX: [0, -10],
  opacity: [1, 0],
  duration: 200,
  easing: 'easeInQuad',
}

/**
 * Stagger delay for sidebar navigation items
 */
export const sidebarStaggerDelay = 50

