<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="2" :throttle="100" />
    <NuxtLayout>
      <NuxtPage :page-key="route => normalizeCourseRoutePath(route.path)" />
    </NuxtLayout>
  </UApp>
</template>
