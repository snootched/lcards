<template>
  <div class="home-badges">
    <a href="https://github.com/snootched/lcards/releases" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/v/release/snootched/lcards?logo=startrek&logoColor=37a6d1&color=37a6d1" alt="GitHub release" />
    </a>

    <a href="https://github.com/snootched/lcards/releases" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/downloads/snootched/lcards/latest/total?logo=startrek&logoColor=37a6d1&label=Latest%20Release%20Downloads&color=37a6d1" alt="downloads" />
    </a>

    <a href="https://github.com/snootched/lcards/stargazers" target="_blank" rel="noopener">
      <img src="https://img.shields.io/github/stars/snootched/lcards?style=flat&logo=stardock&logoColor=37a6d1&color=37a6d1" alt="stars" />
    </a>

    <a href="https://github.com/snootched/lcards/blob/main/LICENSE" target="_blank" rel="noopener">
       <img src="https://img.shields.io/badge/license-MIT-37a6d1?logo=opensourceinitiative&logoColor=white" alt="license">
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
