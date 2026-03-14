/**
 * Reusable animation configurations
 * 
 * Pre-configured animation presets for common use cases.
 */

import type { AnimeParams } from 'animejs'

/**
 * Fade in animation
 */
export const fadeIn: Partial<AnimeParams> = {
  opacity: [0, 1],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Slide in from left
 */
export const slideInLeft: Partial<AnimeParams> = {
  opacity: [0, 1],
  translateX: [-20, 0],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Slide in from right
 */
export const slideInRight: Partial<AnimeParams> = {
  opacity: [0, 1],
  translateX: [20, 0],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Slide in from top
 */
export const slideInTop: Partial<AnimeParams> = {
  opacity: [0, 1],
  translateY: [-20, 0],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Slide in from bottom
 */
export const slideInBottom: Partial<AnimeParams> = {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Scale in animation
 */
export const scaleIn: Partial<AnimeParams> = {
  opacity: [0, 1],
  scale: [0.9, 1],
  duration: 300,
  easing: 'easeOutQuad',
}

/**
 * Fade out animation
 */
export const fadeOut: Partial<AnimeParams> = {
  opacity: [1, 0],
  duration: 200,
  easing: 'easeInQuad',
}

/**
 * Stagger animation for lists
 */
export const staggerConfig: Partial<AnimeParams> = {
  delay: (el, i) => i * 50,
  duration: 300,
  easing: 'easeOutQuad',
}

