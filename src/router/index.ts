
// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Main from '../views/Main.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/main',
    name: 'Main',
    component: Main,
    // 之後會加上路由守衛
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
