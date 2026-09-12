export default defineAppConfig({
  idStudio: {
    templates: {
      course: {
        label: 'Course',
        description: 'The Course catalog, reader, lessons, checkpoints and code workspace.',
        route: '/courses',
        routePrefix: '/courses',
        owner: '@happydesigns/course-nuxt',
      }
    }
  }
});
