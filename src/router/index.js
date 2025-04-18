// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

// 导入页面组件
import Layout from '@/components/Layout.vue'; // 导入统一布局
import Login from '@/views/common/Login.vue'
import Register from '@/views/user/Register.vue'
import Shop from '@/views/user/Shop.vue'
import MyCart from '@/views/user/MyCart.vue'
import MyOrders from '@/views/user/MyOrders.vue'
import MyProfile from '@/views/user/MyProfile.vue'
import ProductDetail from '@/views/user/ProductDetail.vue'
import OrderDetail from '@/views/user/OrderDetail.vue'

// admin
import ManageOrders from '@/views/admin/ManageOrders.vue'
import ManageProducts from '@/views/admin/ManageProducts.vue'
import ManageUsers from '@/views/admin/ManageUsers.vue'
import ProductAdd from '@/views/admin/ProductAdd.vue'
import ProductModify from '@/views/admin/ProductModify.vue'

// 路由配置
const routes = [
  // 公共页面
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },

  // 带 Layout 的用户页面
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Shop', component: Shop },
      { path: '/cart', name: 'MyCart', component: MyCart },
      { path: '/orders', name: 'MyOrders', component: MyOrders },
      { path: '/profile', name: 'MyProfile', component: MyProfile },
      { path: '/product/:id', name: 'ProductDetail', component: ProductDetail },
      { path: '/order/:id', name: 'OrderDetail', component: OrderDetail },
    ],
  },

  // 带 Layout 的管理员页面
  {
    path: '/admin',
    component: Layout,
    children: [
      { path: '/admin/orders', name: 'ManageOrders', component: ManageOrders },
      { path: '/admin/products', name: 'ManageProducts', component: ManageProducts },
      { path: '/admin/users', name: 'ManageUsers', component: ManageUsers },
      { path: '/admin/product/add', name: 'ProductAdd', component: ProductAdd },
      { path: '/admin/product/modify/:id', name: 'ProductModify', component: ProductModify },
    ],
  },
];

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
