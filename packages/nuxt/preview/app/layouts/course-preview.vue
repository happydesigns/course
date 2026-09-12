<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { provideCourseStorage } from '../../../app/composables/useCourseStorage';

const route = useRoute();
const config = useAppConfig();

// This layout persists across catalog/lesson navigation. Studio frames each
// receive their own store; the normal /courses application keeps browser storage.
const isPreview = useNuxtApp().$coursePreviewMode || route.query.idPreview === 'course';
if (isPreview) {
  const memory = new Map<string, string>();
  provideCourseStorage({
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => { memory.set(key, value); }
  });
}

const brand = computed(() => (config as unknown as {
  brand?: { name?: string; assets?: { logos?: Record<string, { src: string; alt?: string }> } }
}).brand);
const logo = computed(() => {
  const logos = brand.value?.assets?.logos;
  return logos?.wordmark ?? logos?.wordmarkInverse;
});
const links = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Courses', to: '/courses',
    active: route.path.startsWith('/courses') && route.path !== '/courses/using-this-tool'
  },
  {
    label: 'How to use', to: '/courses/using-this-tool',
    active: route.path === '/courses/using-this-tool'
  }
]);
</script>

<template>
  <div class="bg-default text-default">
    <UHeader
      :menu="{ title: 'Course navigation', description: 'Browse courses and the authoring guide.' }"
      :ui="{ container: 'max-w-[120rem] px-4 sm:px-6 lg:px-10 xl:px-12' }"
    >
      <template #left>
        <ULink to="/courses" aria-label="Course home" class="flex min-w-0 items-center gap-2">
          <UColorModeImage v-if="logo" :light="logo.src" :dark="brand?.assets?.logos?.wordmarkInverse?.src || logo.src" :alt="logo.alt || brand?.name || 'Course'" class="max-h-7 max-w-36" />
          <template v-else>
            <UIcon name="i-lucide-square-library" class="size-6 shrink-0 text-primary" />
            <span class="text-xl font-bold tracking-tight text-highlighted">{{ brand?.name || 'Course' }}</span>
          </template>
        </ULink>
      </template>
      <UNavigationMenu :items="links" />
      <template #right>
        <UColorModeButton color="neutral" variant="ghost" />
        <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/happydesigns/course" target="_blank" aria-label="GitHub" />
      </template>
      <template #body>
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>
    <slot />
  </div>
</template>
