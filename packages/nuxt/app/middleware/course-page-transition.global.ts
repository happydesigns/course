import { getCoursePageTransitionName } from "../composables/useCourseReaderModel";
import { useCoursePageTransitionContext } from "../composables/useCoursePageTransition";

function freezeLeavingPage(element: Element): void {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const bounds = element.getBoundingClientRect();

  Object.assign(element.style, {
    position: "fixed",
    top: `${bounds.top}px`,
    left: `${bounds.left}px`,
    width: `${bounds.width}px`,
    zIndex: "2",
    pointerEvents: "none"
  });

  // The fixed page keeps the currently visible viewport in place while the
  // incoming document is positioned at its real starting point underneath it.
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export default defineNuxtRouteMiddleware((to, from) => {
  const context = useCoursePageTransitionContext();

  if (!context.value || context.value.currentPath !== from.path) {
    return;
  }

  const transitionName = getCoursePageTransitionName(to.path, [
    context.value.previousPath
      ? { path: context.value.previousPath, title: "Previous" }
      : null,
    context.value.nextPath
      ? { path: context.value.nextPath, title: "Next" }
      : null
  ]);

  const pageTransition = {
    name: transitionName,
    onBeforeLeave: freezeLeavingPage
  };

  // Vue reads the enter transition from the target route and the leave
  // transition from the current route. Update both so the first navigation
  // after changing direction does not leave with the previous direction.
  to.meta.pageTransition = pageTransition;
  from.meta.pageTransition = pageTransition;
});
