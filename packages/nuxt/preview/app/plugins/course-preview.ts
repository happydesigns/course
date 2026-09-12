export default defineNuxtPlugin(() => {
  // Capture the request before the router temporarily restores a prerendered
  // page's query-free URL during app:created and hydration.
  const url = useRequestURL();
  return { provide: { coursePreviewMode: url.searchParams.get('idPreview') === 'course' } };
});
