<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <h2>{{ error.message }}</h2>
    <NuxtLink to="/">Go back home</NuxtLink>
  </div>
</template>

<script setup>
defineProps({
  error: Object
})
</script>