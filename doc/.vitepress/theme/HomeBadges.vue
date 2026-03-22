<template>
  <div class="home-badges">
    <a href="https://github.com/snootched/lcards/releases" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/v/release/snootched/lcards?display_name=release&logo=startrek&color=37a6d1" alt="GitHub release" />
    </a>
    <a href="https://github.com/snootched/lcards/blob/main/LICENSE" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/license/snootched/lcards?logo=opensourceinitiative&logoColor=white" alt="License" />
    </a>
    <a href="https://github.com/snootched/lcards/commits/main" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/last-commit/snootched/lcards?style=default&logo=git&logoColor=white&color=37a6d1" alt="Last commit" />
    </a>
  </div>
</template>

<style scoped>
.home-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}
.home-badges a {
  display: inline-flex;
}
.home-badges img {
  height: 20px;
}
</style>
