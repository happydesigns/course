export default defineAppConfig({
  idStudio: {
    templates: {
      course: {
        label: 'Course',
        description: 'A learning space with a real course reader, lessons and checkpoints.',
        component: 'CourseAcademyPreview',
        owner: '@happydesigns/course-nuxt',
        pages: [{ id: 'home', label: 'Home' }, { id: 'overview', label: 'Course overview' }, { id: 'lesson', label: 'Lesson' }]
      }
    }
  }
});
