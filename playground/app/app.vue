<script setup lang="ts">
const links = [
  { label: "Courses", to: "/blog", active: true },
  { label: "How to use", to: "/blog/using-this-tool" }
];
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <ULink to="/blog" class="flex items-center gap-2">
          <UIcon name="i-lucide-book-open" class="size-6 text-primary" />
          <span class="text-xl font-bold tracking-tight text-highlighted">
            happydesigns<span class="text-primary">/course</span>
          </span>
        </ULink>
      </template>

      <nav class="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
        <ULink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="text-sm font-medium transition-colors hover:text-highlighted"
          :class="link.active ? 'text-primary' : 'text-muted'"
        >
          {{ link.label }}
        </ULink>
      </nav>

      <template #right>
        <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/happydesigns/course" target="_blank" aria-label="GitHub" />
      </template>
    </UHeader>

    <NuxtPage />
  </UApp>
</template>
