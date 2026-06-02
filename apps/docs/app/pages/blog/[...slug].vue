<script setup lang="ts">
import type { VNode } from "vue";
import { computed, provide, ref } from "vue";

const route = useRoute();
const coursePath = computed(() => route.path.replace(/^\/blog\//, "/courses/"));

const { data: course, error } = await useAsyncData(`course-${route.path}`, () =>
  queryCollection("courses").path(coursePath.value).first()
);

if (error.value) {
  throw createError(error.value);
}

if (!course.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

const title = computed(() => course.value?.title ?? "Course");
const description = computed(() => course.value?.description ?? "");
const tree = ref<Record<string, VNode>>({});
const activePath = ref("");
const items = computed(() => Object.entries(tree.value).map(([label, component]) => ({ label, component })));

provide("tree", tree);
provide("activePath", activePath);

useSeoMeta({
  title,
  description
});

function formatDate(date?: string): string {
  if (!date) {
    return "Draft";
  }

  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
</script>

<template>
  <UMain v-if="course" class="min-h-screen">
    <UContainer class="py-6 sm:py-8">
      <UPage
        :ui="{
          center: 'min-w-0 lg:col-span-5 lg:px-0',
          right: 'lg:col-span-5'
        }"
        class="lg:gap-8"
      >
        <UPageHeader :title="course.title" :description="course.description" :ui="{ title: 'relative flex items-center' }">
          <template #headline>
            <UButton
              icon="i-lucide-arrow-left"
              label="Back to blog"
              to="/blog"
              variant="link"
              class="p-0"
              :ui="{ leadingIcon: 'size-4' }"
            />
            <span class="text-muted">&middot;</span>
            <time class="text-muted font-normal">{{ formatDate(course.date) }}</time>
          </template>

          <template #links>
            <UBadge color="primary" variant="soft">{{ course.category ?? "Course" }}</UBadge>
            <UBadge color="neutral" variant="outline">v{{ course.version }}</UBadge>
          </template>

          <div v-if="course.authors?.length" class="mt-6 flex flex-wrap items-center gap-6">
            <template v-for="author in course.authors" :key="author.name">
              <ULink v-if="author.to" :to="author.to" target="_blank" class="group flex items-center gap-3">
                <UAvatar :src="author.avatar?.src" :alt="author.name" size="lg" />
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
                  <span class="text-xs text-muted transition-colors group-hover:text-primary">
                    {{ author.to.replace(/^https?:\/\//, "") }}
                  </span>
                </div>
              </ULink>
              <div v-else class="flex items-center gap-3">
                <UAvatar :src="author.avatar?.src" :alt="author.name" size="lg" />
                <span class="text-sm font-medium text-highlighted">{{ author.name }}</span>
              </div>
            </template>
          </div>
        </UPageHeader>

        <UPageBody>
          <ContentRenderer v-if="course.body" :value="course" />
        </UPageBody>

        <template #right>
          <nav class="hidden h-full max-h-[calc(100vh-var(--ui-header-height,0px))] lg:sticky lg:top-(--ui-header-height) lg:block">
            <ProseCodeTree
              v-if="activePath"
              v-model="activePath"
              :items="items"
              expand-all
              class="h-full rounded-none border-y-0 border-r-0 border-default"
              :ui="{ list: 'border-default', content: '[&>div>pre]:rounded-none [&>div>pre]:border-default [&>div>pre]:bg-muted/50' }"
            />

            <div v-else class="flex h-full min-h-[36rem] items-center justify-center border-l border-default">
              <UIcon name="i-lucide-arrow-down" class="size-12 animate-bounce text-dimmed" />
            </div>
          </nav>
        </template>
      </UPage>
    </UContainer>
  </UMain>
</template>
