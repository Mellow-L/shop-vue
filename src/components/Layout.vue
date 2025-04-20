<template>
    <a-layout>
        <!-- 固定的顶部导航栏 -->
        <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%'}">
        <div class="logo">在线购物系统</div>
        
        
        
        <a-menu
            v-model:selectedKeys="selectedKeys"
            theme="dark"
            mode="horizontal"
            :style="{ lineHeight: '64px' }"
            class="main-menu" 
        >
            <!-- 商品列表: 仅在非管理员登录或未登录时显示 -->
            <a-menu-item key="shop" v-if="!isAdmin" @click="goTo('/')">
              <shop-outlined /> 商品列表
            </a-menu-item>
            <!-- 用户菜单: 仅在非管理员登录后显示 -->
            <template v-if="isLoggedIn && !isAdmin">
                <a-menu-item key="cart" @click="goTo('/cart')">
                <shopping-cart-outlined /> 我的购物车
                </a-menu-item>
                <a-menu-item key="orders" @click="goTo('/orders')">
                <ordered-list-outlined /> 我的订单
                </a-menu-item>
                <a-menu-item key="profile" @click="goTo('/profile')">
                <user-outlined /> 个人资料
                </a-menu-item>
            </template>
            <!-- 管理员菜单: 仅在管理员登录后显示 -->
            <template v-if="isLoggedIn && isAdmin">
              <a-menu-item key="admin-orders" @click="goTo('/admin/orders')">
                  <unordered-list-outlined /> 管理订单
              </a-menu-item>
              <a-menu-item key="admin-products" @click="goTo('/admin/products')">
                  <appstore-outlined /> 管理商品
              </a-menu-item>
              <a-menu-item key="admin-users" @click="goTo('/admin/users')">
                  <team-outlined /> 管理用户
              </a-menu-item>
            </template>
        </a-menu>

        <!-- 右侧按钮区域 (根据登录状态切换) -->
        <div class="right-menu">
            <!-- 未登录时显示 -->
            <template v-if="!isLoggedIn">
                <a-button type="link" @click="goTo('/login')">登录</a-button>
                <a-button type="primary" @click="goTo('/register')">注册</a-button>
            </template>
            <!-- 登录后显示 -->
            <template v-else>
                 <!-- 可以加个用户名或头像显示 -->
                 <span class="user-greeting">欢迎您!</span> 
                 <a-button type="link" danger @click="logout">退出登录</a-button>
            </template>
        </div>
        </a-layout-header>

        <!-- 内容区域，给内容区顶部留出64px空间避免被头部遮挡 -->
        <a-layout-content :style="{ padding: '0 50px', marginTop: '64px' }">
        <router-view /> <!-- 渲染当前路由对应的页面内容 -->
        </a-layout-content>

        <!-- 底部 -->
        <a-layout-footer :style="{ textAlign: 'center' }">
        在线购物系统 ©2025 Created by LYR
        </a-layout-footer>
    </a-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue'; // Import message
import { 
    ShopOutlined, 
    ShoppingCartOutlined, 
    OrderedListOutlined, 
    UserOutlined, 
    UnorderedListOutlined, 
    AppstoreOutlined, 
    TeamOutlined 
} from '@ant-design/icons-vue';

const router = useRouter();
const selectedKeys = ref(['shop']); // 默认选中商品列表

// 登录和角色状态
const isLoggedIn = ref(false);
const isAdmin = ref(false);

// 检查本地存储的登录状态
const checkLoginStatus = () => {
  const loggedInStatus = localStorage.getItem('isLoggedIn');
  const managerStatus = localStorage.getItem('isManager'); 
  isLoggedIn.value = loggedInStatus === 'true';
  isAdmin.value = managerStatus === 'true';
  
  // 根据状态更新 selectedKeys (可选)
  if (isLoggedIn.value) {
      if (isAdmin.value) {
          // 如果是管理员，可能默认选中第一个管理员菜单
          selectedKeys.value = ['admin-orders']; 
      } else {
          // 如果是普通用户，默认商品列表
          selectedKeys.value = ['shop'];
      }
  } else {
       selectedKeys.value = ['shop']; // 未登录默认商品列表
  }
};

// 组件挂载时检查状态
onMounted(() => {
  checkLoginStatus();
  // 添加事件监听器，以便在其他标签页修改 localStorage 时也能同步状态 (可选但推荐)
  window.addEventListener('storage', checkLoginStatus);
});

// 组件卸载前移除监听器 (可选但推荐)
onUnmounted(() => {
    window.removeEventListener('storage', checkLoginStatus);
});

const goTo = (path) => {
  router.push(path);
  // 手动更新 selectedKeys，因为 Menu 的 v-model 可能不会自动处理编程导航
  // 这部分逻辑可以根据实际 Menu 结构优化
  if (path === '/') selectedKeys.value = ['shop'];
  else if (path === '/cart') selectedKeys.value = ['cart'];
  else if (path === '/orders') selectedKeys.value = ['orders'];
  else if (path === '/profile') selectedKeys.value = ['profile'];
  else if (path.startsWith('/admin')) {
      if (path.includes('orders')) selectedKeys.value = ['admin-orders'];
      else if (path.includes('products')) selectedKeys.value = ['admin-products'];
      else if (path.includes('users')) selectedKeys.value = ['admin-users'];
      else selectedKeys.value = ['admin-orders']; // Default admin key
  } else {
      selectedKeys.value = ['shop']; // Fallback
  }
};

// 退出登录处理
const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('isManager'); 
  localStorage.removeItem('userInfo'); // Make sure userInfo is cleared too

  isLoggedIn.value = false; // 更新本地状态
  isAdmin.value = false;
  message.success('已退出登录');
  // Redirect to shop page instead of login page
  router.push('/'); 
  // Optionally reset selectedKeys after navigation
  selectedKeys.value = ['shop']; 
};
</script>

<style scoped>
.logo {
    width: 150px; /* Adjusted width */
    height: 31px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    margin: 16px 16px 16px 0; /* Adjusted margin */
    float: left;
    display: flex;
    align-items: center;
}

.right-menu {
    float: right;
    margin-right: 0; /* Reset margin, rely on header padding */
    height: 64px; 
    display: flex;
    align-items: center;
    gap: 8px; /* Add gap between buttons */
}

.user-greeting {
    color: rgba(255, 255, 255, 0.85);
    margin-right: 8px;
}

/* Give menu some space from the right buttons */
.main-menu.ant-menu-horizontal {
   /* Let Flexbox handle spacing, remove fixed margin-right */
   /* margin-right: 200px; */
   border-bottom: none; 
   flex: 1; /* Allow menu to take remaining space */
   display: flex; /* Ensure menu items are laid out correctly */
   justify-content: flex-start; /* Align items to the start */
}

/* Ensure header content aligns properly */
:deep(.ant-layout-header) {
    display: flex;
    align-items: center;
    padding: 0 24px; /* Adjust padding if needed */
}

.site-layout .site-layout-background {
    background: #fff;
}

[data-theme='dark'] .site-layout .site-layout-background {
    background: #141414;
}
</style>
  