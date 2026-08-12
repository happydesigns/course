<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const links = computed<NavigationMenuItem[]>(() => [
  {
    label: "Courses",
    to: "/courses",
    active: route.path.startsWith("/courses") && route.path !== "/courses/using-this-tool"
  },
  {
    label: "How to use",
    to: "/courses/using-this-tool",
    active: route.path === "/courses/using-this-tool"
  }
]);
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      color="var(--ui-primary)"
      :height="2"
      :throttle="100"
    />

    <UHeader
      :ui="{
        container: 'max-w-[120rem] px-4 sm:px-6 lg:px-10 xl:px-12'
      }"
    >
      <template #left>
        <ULink to="/courses" class="flex items-center gap-2">
          <UIcon name="i-lucide-square-library" class="size-6 shrink-0 text-primary" />
          <span class="text-xl font-bold tracking-tight text-highlighted">
            Course
          </span>
        </ULink>
      </template>

      <UNavigationMenu :items="links" />

      <template #right>
        <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/happydesigns/course" target="_blank" aria-label="GitHub" />
      </template>

      <template #body>
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <NuxtLayout>
      <NuxtPage :page-key="route => normalizeCourseRoutePath(route.path)" />
    </NuxtLayout>
  </UApp>
</template>
