<script setup lang="ts">
const route = useRoute();
const target = computed(() => route.path.replace(/^\/blog/, "/courses"));
await navigateTo(target.value, { replace: true, redirectCode: 301 });
</script>

<template>
  <div />
</template>
