import { createApp, h } from 'vue'

import App from './App.vue'

import router from './router'
import Antd, { ConfigProvider } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

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
