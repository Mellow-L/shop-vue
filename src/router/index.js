// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// 导入页面组件
import Layout from '@/components/Layout.vue'; // 导入统一布局

// 路由配置
const routes = [
  // 公共页面
  { path: '/login', name: 'Login', component: () => import('@/views/common/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/user/Register.vue') },

  // 带 Layout 的用户页面
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Shop', component: () => import('@/views/user/Shop.vue') },
      { path: '/cart', name: 'MyCart', component: () => import('@/views/user/MyCart.vue') },
      { path: '/orders', name: 'MyOrders', component: () => import('@/views/user/MyOrders.vue') },
      { path: '/profile', name: 'MyProfile', component: () => import('@/views/user/MyProfile.vue') },
      { path: '/product/:id', name: 'ProductDetail', component: () => import('@/views/user/ProductDetail.vue') },
      { path: '/order/:id', name: 'OrderDetail', component: () => import('@/views/user/OrderDetail.vue') },
      { path: '/change-password', name: 'ChangePassword', component: () => import('@/views/user/ChangePassword.vue') },
      { path: '/confirm-order', name: 'OrderConfirmation', component: () => import('@/views/user/OrderConfirmation.vue') },
    ],
  },

  // 带 Layout 的管理员页面
  {
    path: '/admin',
    component: Layout,
    children: [
      { path: '/admin/orders', name: 'ManageOrders', component: () => import('@/views/admin/ManageOrders.vue') },
      { path: '/admin/orders/:id', name: 'AdminOrderDetail', component: () => import('@/views/admin/OrderDetailManage.vue') },
      { path: '/admin/products', name: 'ManageProducts', component: () => import('@/views/admin/ManageProducts.vue') },
      { path: '/admin/users', name: 'ManageUsers', component: () => import('@/views/admin/ManageUsers.vue') },
      { path: '/admin/user/:id', name: 'AdminUserDetail', component: () => import('@/views/admin/UserDetailManage.vue'), props: true },
      { path: '/admin/product/add', name: 'ProductAdd', component: () => import('@/views/admin/ProductAdd.vue') },
      { path: '/admin/product/modify/:id', name: 'ProductModify', component: () => import('@/views/admin/ProductModify.vue') },
    ],
  },
];

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
export function gotoLogin(){
  router.push({name:'Login'})
}
