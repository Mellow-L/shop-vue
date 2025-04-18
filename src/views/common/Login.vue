<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <h1 class="system-title">在线购物系统</h1>
      <h2 class="page-title">用户登录</h2>
      <a-form
        :model="formState"
        name="loginForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        autocomplete="off"
        @finish="onFinish"
      >
        <a-form-item
          label="电子邮箱"
          name="email"
          :rules="[
            { required: true, message: '请输入电子邮箱!' },
            { type: 'email', message: '请输入有效的电子邮箱格式!' }
          ]"
        >
          <a-input v-model:value="formState.email" placeholder="请输入电子邮箱" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <div class="login-options">
            <a-checkbox v-model:checked="formState.remember">记住密码</a-checkbox>
            <a-checkbox v-model:checked="formState.isAdmin">我是管理员</a-checkbox>
          </div>
          <a class="login-form-forgot" href="">忘记密码</a>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
          <a-button type="primary" html-type="submit" class="login-form-button">登录</a-button>
          或 <router-link to="/register">立即注册!</router-link>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const formState = reactive({
  email: '',
  password: '',
  remember: true,
  isAdmin: false,
});

const onFinish = values => {
  console.log('登录表单提交的值:', values);
  // --- 模拟登录成功 ---
  // 在实际应用中，这里应该调用后端 API 验证
  // const loginSuccess = await backendLogin(values);
  const loginSuccess = true; // 假设登录总是成功

  if (loginSuccess) {
    // 存储登录状态和角色到 localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('isAdmin', formState.isAdmin ? 'true' : 'false');
    
    message.success('登录成功!');
    
    // 根据是否是管理员决定跳转位置
    if (formState.isAdmin) {
      router.push('/admin/products'); // 跳转到管理员页面
    } else {
      router.push('/'); // 跳转到普通用户主页
    }
  } else {
    // 实际应用中处理登录失败
     message.error('邮箱或密码错误!');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
}

.system-title {
  text-align: center;
  color: #1890ff;
  font-size: 24px;
  margin-bottom: 10px;
}

.page-title {
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
}

.login-options {
  display: flex;
  gap: 20px;
}

.login-form-forgot {
  float: right;
}

.login-form-button {
  width: 100%;
  margin-bottom: 10px;
}
</style>
  