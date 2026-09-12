export default defineNuxtConfig({
  $meta: { name: '@happydesigns/course-preview' },
  extends: ['..'],
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['abap', 'bash', 'css', 'json', 'mdc', 'ts', 'typescript', 'vue']
        }
      }
    }
  }
});
