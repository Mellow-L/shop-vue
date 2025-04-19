import { createApp, h } from 'vue'

import App from './App.vue'

import router from './router'
import Antd, { ConfigProvider } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import axios from 'axios' // 导入 axios
import apiConfig from './config/api' // 导入 API 配置

// --- Axios 全局配置 ---
axios.defaults.baseURL = apiConfig.BASE_URL;
axios.defaults.timeout = apiConfig.TIMEOUT || 5000;
// 这里还可以添加其他的全局配置，例如请求拦截器、响应拦截器等
// axios.interceptors.request.use(config => {
//   // 例如：添加 token
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

// 创建包含 ConfigProvider 的根组件
const app = createApp({
  render: () => h(ConfigProvider, {
    // 全局化配置
    theme: {
      token: {
        colorPrimary: '#FA8C16', // 设置全局主色调为橙色
        // 可以根据需要覆盖其他颜色或样式变量
        // colorLink: '#FA8C16', // 链接颜色
        // borderRadius: 4,      // 圆角大小
      },
    },
  }, () => h(App)), // 将 App 组件作为子节点渲染
});

app.use(router)
app.use(Antd)
app.mount('#app')
