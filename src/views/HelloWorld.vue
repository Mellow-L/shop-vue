<template>
    <div>
      <h1>{{ message }}</h1>
      <button @click="fetchMessage">获取消息</button>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        message: '', 
      };
    },
    methods: {
      async fetchMessage() {
        try {
          // 请求接口获取数据
          const response = await axios.get('http://10.215.107.26:8080/');
          // 假设接口返回的是 JSON 数据，包含 message 字段
          this.message = response.data.message || response.data; 
        } catch (error) {
          console.error('请求失败', error);
        }
      },
    },
    created() {
      // 自动请求数据（可选）
      this.fetchMessage();
    },
  };
  </script>
  
  <style scoped>
  /* 你可以添加样式 */
  h1 {
    color: green;
  }
  </style>
  