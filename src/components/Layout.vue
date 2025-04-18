<template>
    <a-layout>
        <!-- 固定的顶部导航栏 -->
        <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%'}">
        <div class="logo">在线购物系统</div>
        
        <!-- 将右侧按钮移到 a-menu 外面 -->
        <div class="right-menu">
            <a-button type="link" @click="goTo('/login')">登录</a-button>
            <a-button type="primary" @click="goTo('/register')">注册</a-button>
        </div>
        
        <a-menu
            v-model:selectedKeys="selectedKeys"
            theme="dark"
            mode="horizontal"
            :style="{ lineHeight: '64px' }"
        >
            <a-menu-item key="1" @click="goTo('/')">
            <shop-outlined /> 商品列表
            </a-menu-item>
            <a-menu-item key="2" @click="goTo('/cart')">
            <shopping-cart-outlined /> 我的购物车
            </a-menu-item>
            <a-menu-item key="3" @click="goTo('/orders')">
            <ordered-list-outlined /> 我的订单
            </a-menu-item>
            <a-menu-item key="4" @click="goTo('/profile')">
            <user-outlined /> 个人资料
            </a-menu-item>
            <!-- 管理员菜单 -->
            <a-sub-menu key="admin" title="管理员控制台">
            <a-menu-item key="admin-orders" @click="goTo('/admin/orders')">
                <unordered-list-outlined /> 管理订单
            </a-menu-item>
            <a-menu-item key="admin-products" @click="goTo('/admin/products')">
                <appstore-outlined /> 管理商品
            </a-menu-item>
            <a-menu-item key="admin-users" @click="goTo('/admin/users')">
                <team-outlined /> 管理用户
            </a-menu-item>
            </a-sub-menu>

            <!-- 右侧登录/注册按钮 (已移到 a-menu 外面) -->
            <!-- 
            <div class="right-menu">
                <a-button type="link" @click="goTo('/login')">登录</a-button>
                <a-button type="primary" @click="goTo('/register')">注册</a-button>
            </div>
            -->
        </a-menu>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
    ShopOutlined, 
    ShoppingCartOutlined, 
    OrderedListOutlined, 
    UserOutlined, 
    UnorderedListOutlined, 
    AppstoreOutlined, 
    TeamOutlined 
} from '@ant-design/icons-vue';

const selectedKeys = ref(['1']); // 当前选择的菜单项
const router = useRouter();

const goTo = (path) => {
router.push(path); // 跳转到指定路径
};
</script>

<style scoped>
.logo {
    width: 200px;
    height: 31px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    margin: 16px 24px 16px 0;
    float: left;
    display: flex;
    align-items: center;
}

.right-menu {
    float: right;
    margin-right: 20px;
    /* 可能需要调整 margin 或 line-height 使其垂直居中 */
    height: 64px; /* 与 a-layout-header 高度一致 */
    display: flex;
    align-items: center;
}

/* 修改 a-menu 样式，避免与右侧按钮重叠 */
.ant-menu-horizontal {
    margin-right: 200px; /* 为右侧按钮留出空间，根据实际按钮宽度调整 */
    border-bottom: none; /* antd v4 可能不需要这个 */
}

.site-layout .site-layout-background {
    background: #fff;
}

[data-theme='dark'] .site-layout .site-layout-background {
    background: #141414;
}
</style>
  