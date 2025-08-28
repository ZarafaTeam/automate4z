<script setup>
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
// Logic de base, par exemple charger la liste des workflows
</script>

<template>
  <Navbar />
  <div class="min-h-screen bg-base-200 p-4">
    <h1 class="text-2xl font-bold mb-4">a4z Workflow Builder</h1>
    <!-- À compléter : router-view, composants drag & drop, etc. -->
    <div role="alert" class="alert alert-success">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="h-6 w-6 shrink-0 stroke-current"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span>New software update available.</span>
    </div>
  </div>

  <Footer />
</template>

<style>
/* styles globaux si besoin */
</style>
