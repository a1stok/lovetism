/**
 * React hooks for animations
 * 
 * Reusable hooks that integrate animejs with React components.
 */

import { useEffect, useRef, type RefObject } from 'react'
import { animate, type AnimeParams } from 'animejs'

/**
 * Hook to animate an element when it mounts or when dependencies change
 * 
 * @param config - Animation configuration
 * @param deps - Dependencies array (like useEffect)
 * 
 * @example
 * ```tsx
 * const elementRef = useAnimate({
 *   ...fadeIn,
 *   targets: elementRef.current,
 * }, [isVisible])
 * ```
 */
export function useAnimate(
  config: AnimeParams,
  deps: React.DependencyList = [],
): RefObject<HTMLElement> {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (elementRef.current) {
      animate({
        ...config,
        targets: elementRef.current,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return elementRef
}

/**
 * Hook to animate an element when it enters the viewport
 * 
 * @param config - Animation configuration
 * @param options - IntersectionObserver options
 * 
 * @example
 * ```tsx
 * const elementRef = useAnimateOnScroll({
 *   ...fadeIn,
 * })
 * ```
 */
export function useAnimateOnScroll(
  config: AnimeParams,
  options: IntersectionObserverInit = { threshold: 0.1 },
): RefObject<HTMLElement> {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate({
            ...config,
            targets: element,
          })
          observer.unobserve(element)
        }
      })
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [config, options])

  return elementRef
}

/**
 * Hook to animate multiple elements with stagger effect
 * 
 * @param config - Base animation configuration
 * @param staggerDelay - Delay between each element (in ms)
 * 
 * @example
 * ```tsx
 * const containerRef = useStaggerAnimate({
 *   ...fadeIn,
 * }, 50)
 * ```
 */
export function useStaggerAnimate(
  config: AnimeParams,
  staggerDelay: number = 50,
): RefObject<HTMLElement> {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const children = containerRef.current.children
      animate({
        ...config,
        targets: children,
        delay: (el, i) => i * staggerDelay,
      })
    }
  }, [config, staggerDelay])

  return containerRef
}

