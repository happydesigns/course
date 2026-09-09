<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CoursePage } from '../../app/types/course';
import { provideCourseStorage } from '../../app/composables/useCourseStorage';

const props = defineProps<{ page?: string; document?: { theme: { label: string }; brand: { claim?: string; assets?: { logos?: Record<string, { src: string; alt?: string }> } } }; mode?: string }>();
const emit = defineEmits<{ navigate: [page: string] }>();
const current = ref(props.page || 'home');
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
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <button class="flex min-w-0 items-center gap-3" aria-label="Academy home" @click="go('home')">
          <img v-if="logo" :src="logo.src" :alt="logo.alt || name" class="max-h-7 max-w-32 sm:max-w-36">
          <span v-else class="text-xl font-semibold tracking-tight text-highlighted">{{ name }}<span class="text-primary">.</span></span>
          <span class="hidden border-l border-default pl-3 text-xs text-muted sm:inline">Learning together</span>
        </button>
        <nav aria-label="Academy navigation" class="flex gap-2">
          <UButton color="neutral" variant="ghost" class="hidden sm:inline-flex" @click="go('overview')">The course</UButton>
          <UButton class="shrink-0 whitespace-nowrap" @click="go('lesson')">Start learning</UButton>
        </nav>
      </div>
    </header>
    <UAlert v-if="error || !course" class="m-8" color="error" title="Course example unavailable" description="The optional preview content collection must be included in this build." />
    <template v-else-if="current === 'home'">
      <section class="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <UBadge variant="subtle" icon="i-lucide-sparkles">Make something worth sharing</UBadge>
          <h1 class="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-highlighted sm:text-6xl">Small lessons.<br>Lasting skills.</h1>
          <p class="mt-6 max-w-lg text-lg leading-8 text-muted">Learn by making. Build your confidence with a thoughtful project, practical checkpoints and a clear next step.</p>
          <div class="mt-8 flex flex-wrap items-center gap-4"><UButton size="lg" trailing-icon="i-lucide-arrow-right" @click="go('overview')">Explore the course</UButton><span class="text-xs text-muted">At your pace. In your own way.</span></div>
          <div class="mt-10 flex items-center gap-3"><UAvatarGroup><UAvatar v-for="person in ['Alex Morgan', 'Sam Taylor', 'Jamie Chen']" :key="person" :alt="person" /></UAvatarGroup><p class="text-sm text-muted">A place for curious minds.</p></div>
        </div>
        <div class="rounded-2xl border border-default bg-muted p-5 sm:p-8">
          <div class="mb-6 flex items-center justify-between"><span class="text-xs font-medium uppercase tracking-widest text-muted">Your next chapter</span><UIcon name="i-lucide-book-open" class="size-5 text-primary" /></div>
          <UCard><UBadge color="neutral" variant="subtle">Design foundations</UBadge><h2 class="mt-5 text-2xl font-semibold text-highlighted">{{ course.title }}</h2><p class="mt-3 leading-7 text-muted">{{ course.description }}</p><USeparator class="my-6" /><div class="flex items-center justify-between text-sm"><span class="text-muted">One focused lesson</span><span class="text-highlighted">{{ lessons[0]?.estimatedMinutes }} minutes</span></div><UButton class="mt-6" block @click="go('lesson')">Begin your first lesson</UButton></UCard>
          <div class="mt-5 flex items-center gap-3 text-sm text-muted"><UIcon name="i-lucide-check-circle-2" class="size-5 text-primary" />Real code. Practical checkpoints.</div>
        </div>
      </section>
      <section class="border-y border-default bg-muted/30"><div class="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-3 sm:px-8"><div v-for="(item, index) in [{ title: 'Learn with purpose', text: 'A clear outcome gives every small step meaning.' }, { title: 'Make it tangible', text: 'Watch a working example take shape as you read.' }, { title: 'See your progress', text: 'Check your understanding before moving forward.' }]" :key="item.title"><span class="font-mono text-xs text-primary">0{{ index + 1 }}</span><h2 class="mt-3 font-semibold text-highlighted">{{ item.title }}</h2><p class="mt-2 text-sm leading-6 text-muted">{{ item.text }}</p></div></div></section>
      <section class="mx-auto max-w-7xl px-5 py-12 sm:px-8"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-xs uppercase tracking-widest text-muted">A good place to begin</p><h2 class="mt-3 text-2xl font-semibold text-highlighted">Build the foundations.</h2></div><UButton color="neutral" variant="outline" @click="go('overview')">View learning path</UButton></div><button class="mt-6 flex w-full items-center justify-between gap-5 rounded-xl border border-default p-6 text-left hover:bg-muted" @click="go('lesson')"><div><span class="text-xs text-primary">Lesson 01 · {{ lessons[0]?.estimatedMinutes }} min</span><h3 class="mt-2 text-lg font-semibold text-highlighted">{{ lessons[0]?.title }}</h3><p class="mt-2 text-sm text-muted">{{ lessons[0]?.description }}</p></div><UIcon name="i-lucide-arrow-up-right" class="size-6 shrink-0 text-primary" /></button></section>
    </template>
    <CourseReader v-else :course="course" :page="current === 'lesson' ? lessons[0] : course" :lessons="lessons" course-key="academy-example" :back="{ label: 'Academy', to: '?academy=home' }" />
    <footer class="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-default px-5 py-6 text-xs text-muted sm:px-8"><span>{{ name }}<template v-if="name !== 'Academy'"> · Academy</template></span><span>Keep a little room for learning.</span></footer>
  </div>
</template>
