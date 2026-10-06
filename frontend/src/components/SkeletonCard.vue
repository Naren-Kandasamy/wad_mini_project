<template>
  <div class="tactile-card p-4 flex flex-col gap-3">
    <!-- Image Box Skeleton -->
    <div class="skeleton-shimmer h-48 w-full rounded-xl"></div>

    <!-- Category Pill -->
    <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>

    <!-- Title Lines -->
    <div class="skeleton-shimmer h-6 w-3/4 rounded-md"></div>
    <div class="skeleton-shimmer h-4 w-1/2 rounded-md"></div>

    <!-- Footer: Price & Button -->
    <div class="flex items-center justify-between pt-3 mt-auto border-t border-[var(--border-subtle)]">
      <div class="skeleton-shimmer h-7 w-20 rounded-md"></div>
      <div class="skeleton-shimmer h-10 w-28 rounded-xl"></div>
    </div>
  </div>
</template>

<style scoped>
.tactile-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.skeleton-shimmer {
  border-radius: 0.875rem;
}
</style>
