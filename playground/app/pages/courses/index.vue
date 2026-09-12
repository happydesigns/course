<script setup lang="ts">
interface CoursePostAuthor {
  name: string;
  to?: string;
  avatar?: {
    src?: string;
  };
}

interface CoursePost {
  path: string;
  title: string;
  description: string;
  date?: string;
  category?: string;
  authors?: CoursePostAuthor[];
  courseId?: string;
  pageType?: "course" | "lesson";
}

const content = useCourseContent();
const { data: coursePages } = await useAsyncData("course-catalog", () => content.all());

const posts = computed<CoursePost[]>(() => {
  return [...((coursePages.value ?? []) as CoursePost[])]
    .filter((page) => page.pageType !== "lesson")
    .sort((left, right) => {
    const leftDate = left.date ? new Date(left.date).getTime() : 0;
    const rightDate = right.date ? new Date(right.date).getTime() : 0;

    if (leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    return left.title.localeCompare(right.title);
    });
});

function courseLessons(post: CoursePost) {
  return (coursePages.value ?? []).filter(
    (page) => page.pageType === "lesson" && page.courseId && page.courseId === post.courseId
  );
}

useSeoMeta({
  title: "Courses",
  description: "Practical courses with step-by-step lessons and synchronized code examples."
});

function formatDate(date?: string): string {
  if (!date) {
    return "Draft";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
</script>

<template>
  <UMain class="relative flex min-h-screen flex-col">
    <UPageHero
      title="Courses"
      description="Practical courses with step-by-step lessons and synchronized code examples."
      :ui="{ container: 'relative py-10 sm:py-16 lg:py-24' }"
    >
      <div aria-hidden="true" class="absolute inset-0 z-[-1] mx-4 border-x border-default sm:mx-6 lg:mx-8" />
    </UPageHero>

    <UPageBody class="my-0! border-y border-default py-0!">
      <UContainer>
        <div class="border-x border-default">
          <div v-for="post in posts" :key="post.path" class="group border-b border-default last:border-b-0">
            <ULink
              :to="post.path"
              class="flex flex-col justify-between gap-4 p-4 transition-colors duration-200 hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
            >
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span v-if="post.date">
                    Updated <time :datetime="post.date" class="font-mono">{{ formatDate(post.date) }}</time>
                  </span>
                  <span v-else>Draft</span>
                  <span v-if="post.category" class="text-dimmed">/</span>
                  <span v-if="post.category">{{ post.category }}</span>
                </div>

                <h2 class="truncate font-medium text-highlighted transition-colors duration-200 group-hover:text-primary sm:text-base">
                  {{ post.title }}
                </h2>
                <p class="mt-1 line-clamp-2 text-sm text-muted sm:line-clamp-1">
                  {{ post.description }}
                </p>
                <CourseProgressSummary
                  v-if="post.courseId"
                  :course-id="post.courseId"
                  :lessons="courseLessons(post)"
                />
              </div>

              <div class="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-2">
                <UAvatarGroup v-if="post.authors?.length" size="sm">
                  <UAvatar
                    v-for="author in post.authors.slice(0, 3)"
                    :key="author.name"
                    :src="author.avatar?.src"
                    :alt="author.name"
                    size="sm"
                  />
                </UAvatarGroup>

                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 shrink-0 text-muted transition-colors duration-200 group-hover:text-highlighted"
                />
              </div>
            </ULink>
          </div>
        </div>
      </UContainer>
    </UPageBody>

    <UContainer class="relative grow">
      <div aria-hidden="true" class="absolute inset-0 z-[-1] mx-4 border-x border-default sm:mx-6 lg:mx-8" />
    </UContainer>
  </UMain>
</template>
