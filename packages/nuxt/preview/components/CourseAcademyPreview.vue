<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CoursePage } from '../../app/types/course';
import { provideCourseStorage } from '../../app/composables/useCourseStorage';

const props = defineProps<{ page?: string; document?: { theme: { label: string }; brand: { claim?: string; assets?: { logos?: Record<string, { src: string; alt?: string }> } } }; mode?: string }>();
const emit = defineEmits<{ navigate: [page: string] }>();
const route = useRoute();
const initialPage = props.page || String(route.query.academy || 'home');
const current = ref(['home', 'overview', 'lesson'].includes(initialPage) ? initialPage : 'home');
watch(() => props.page, page => {
  if (page && ['home', 'overview', 'lesson'].includes(page)) {
    current.value = page;
    if (import.meta.client) window.scrollTo({ top: 0, behavior: 'instant' });
  }
});
// Each mounted example owns its progress. No writes reach a real learner's storage,
// and original/draft previews never share progress even on the same origin.
const memory = new Map<string, string>();
provideCourseStorage({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); } });
const { data, error } = await useAsyncData('course-academy-example', () => queryCollection('coursePreview').all());
const course = computed(() => {
  const item = data.value?.find(item => item.pageType === 'course');
  return item ? { ...item, path: '?academy=overview' } as CoursePage : undefined;
});
const lessons = computed(() => (data.value ?? []).filter(item => item.pageType === 'lesson').map(item => ({ ...item, path: '?academy=lesson' }) as CoursePage));
const name = computed(() => props.document?.theme.label || 'Academy');
const logo = computed(() => {
  const logos = props.document?.brand.assets?.logos;
  return (props.mode === 'dark' ? logos?.wordmarkInverse : undefined) ?? logos?.wordmark;
});
function go(page: string) {
  if (!['home', 'overview', 'lesson'].includes(page)) return;
  current.value = page;
  emit('navigate', page);
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'instant' });
}
function follow(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as Element).closest('a');
  const href = anchor?.getAttribute('href');
  if (!href || !href.includes('academy=')) return;
  const page = new URL(href, 'https://preview.invalid').searchParams.get('academy');
  if (!page || !['home', 'overview', 'lesson'].includes(page)) return;
  event.preventDefault(); event.stopPropagation(); go(page);
}
</script>

<template>
  <div class="academy bg-default text-default" @click.capture="follow">
    <header class="border-b border-default">
      <UContainer class="flex items-center justify-between gap-4 py-5">
        <NuxtLink to="?academy=home" aria-label="Academy home" class="min-w-0 rounded focus-visible:outline-2 focus-visible:outline-primary">
          <img v-if="logo" :src="logo.src" :alt="logo.alt || name" class="max-h-7 max-w-32 sm:max-w-36">
          <span v-else class="text-xl font-semibold text-highlighted">{{ name }}</span>
        </NuxtLink>
        <nav aria-label="Academy navigation" class="flex gap-2">
          <UButton to="?academy=overview" color="neutral" variant="ghost" class="hidden sm:inline-flex">Course overview</UButton>
          <UButton to="?academy=lesson" class="shrink-0">Start lesson</UButton>
        </nav>
      </UContainer>
    </header>
    <UAlert v-if="error || !course" class="m-8" role="alert" color="error" title="Course unavailable" description="The course content could not be loaded." />
    <template v-else-if="current === 'home'">
      <UPageHero orientation="horizontal" title="Build your first interface" description="Practice layout, semantic colors and keyboard accessibility in a short course with working code." :ui="{ container: 'py-12 sm:py-16 lg:py-20 gap-10', title: 'text-4xl sm:text-5xl' }">
        <template #links><UButton to="?academy=overview" size="lg" trailing-icon="i-lucide-arrow-right">Explore the course</UButton></template>
        <UPageCard :description="course.description" variant="subtle" :ui="{ description: 'text-muted' }">
          <template #leading><UBadge color="neutral" variant="subtle">{{ course.category }}</UBadge></template>
          <template #title><h2 class="text-2xl">{{ course.title }}</h2></template>
          <template #footer>
            <div class="flex items-center justify-between gap-4 text-sm text-muted"><span>{{ lessons.length }} lesson</span><span>{{ lessons[0]?.estimatedMinutes }} min</span></div>
            <UButton to="?academy=lesson" block class="mt-5">Start lesson</UButton>
          </template>
        </UPageCard>
      </UPageHero>
      <UPageSection title="Lessons" :ui="{ container: 'py-10 sm:py-12 lg:py-12 gap-6', title: 'text-2xl sm:text-2xl lg:text-2xl text-left' }">
        <UPageCard v-for="(lesson, index) in lessons" :key="lesson.path" :to="lesson.path" :description="lesson.description" orientation="horizontal">
          <template #leading><span class="text-sm text-muted">{{ String(index + 1).padStart(2, '0') }}</span></template>
          <template #title><h3>{{ lesson.title }}</h3></template>
          <span class="shrink-0 text-sm text-muted">{{ lesson.estimatedMinutes }} min</span>
        </UPageCard>
      </UPageSection>
    </template>
    <CourseReader v-else :course="course" :page="current === 'lesson' ? lessons[0] : course" :lessons="lessons" course-key="academy-example" :back="{ label: 'Academy', to: '?academy=home' }" />
    <footer class="border-t border-default"><UContainer class="py-6 text-xs text-muted">{{ name }}</UContainer></footer>
  </div>
</template>
