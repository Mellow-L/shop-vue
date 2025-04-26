<template>
  <div class="manage-users-container">
    <div class="header-controls">
      <h1 class="page-title">用户管理</h1>
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索用户ID、用户名或邮箱"
        style="width: 300px"
        enter-button
        @search="handleSearch"
        allowClear
      />
    </div>

    <!-- Loading/Error/Empty States -->
    <div v-if="loading" class="loading-indicator">
       <a-spin size="large" tip="加载用户列表中..."/>
    </div>
    <div v-else-if="error" class="error-indicator">
        <a-alert message="加载用户失败" :description="error" type="error" show-icon>
             <template #action>
                <a-button type="primary" @click="fetchUsers">重试</a-button>
             </template>
        </a-alert>
    </div>
    <div v-else-if="users.length === 0" class="empty-users">
        <a-empty :description="searchValue ? '未找到匹配的用户' : '暂无用户'" />
    </div>

    <!-- Users Grid -->
    <a-list
        v-else
        class="users-grid"
        :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 5 }"
        :dataSource="users"
        :pagination="pagination"
    >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card hoverable class="user-profile-card" @click="viewUserDetail(item.user_id)">
              <a-card-meta>
                 <template #avatar>
                    <a-avatar :size="64" :src="getFullImageUrl(item.avatar) || 'https://placehold.co/100x100?text=No+Avatar'" />
                 </template>
                 <template #title>
                    <div class="user-card-name">{{ item.username || item.email || 'N/A' }}</div>
                 </template>
                 <template #description>
                    <p class="user-card-id">ID: {{ item.user_id }}</p>
                    <!-- Add other info like registration date if available -->
                    <!-- <p>注册时间: {{ formatDateTime(item.registration_date) }}</p> -->
                 </template>
              </a-card-meta>
            </a-card>
          </a-list-item>
        </template>
    </a-list>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Spin, Empty, Button, List, Card, CardMeta, Avatar, InputSearch, Alert } from 'ant-design-vue';
// Import User API functions - ENSURE THESE EXIST AND ARE CORRECT
import { apiGetUserList, apiSearchUserList } from '@/api/user';
import apiConfig from '@/config/api'; // For image URL

const router = useRouter();
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const searchValue = ref('');

const pagination = reactive({
  current: 1,
  pageSize: 18, // Adjust as needed
  total: 0,
  onChange: (page, pageSize) => {
    pagination.current = page;
    pagination.pageSize = pageSize;
    // If using server-side pagination, call fetchUsers() here
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  showTotal: total => `共 ${total} 条`,
  showSizeChanger: true,
  pageSizeOptions: ['18', '36', '54', '72'],
});

// Helper to get full image URL
const getFullImageUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
  const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return baseUrl + imagePath;
};

// Fetch users function (handles search)
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  let apiCall;

  if (searchValue.value) {
      console.log(`Searching users for: ${searchValue.value}`);
      // Call apiSearchUserList with the search string directly
      apiCall = () => apiSearchUserList(searchValue.value); 
  } else {
      console.log("Fetching all users");
      // apiGetUserList might still accept params for pagination etc.
      let listParams = {}; 
      // Example pagination (if needed later):
      // listParams = { page: pagination.current, size: pagination.pageSize };
      apiCall = () => apiGetUserList(listParams);
  }

  try {
    const res = await apiCall();
    if (res && res.code === 200 && Array.isArray(res.list)) {
      users.value = res.list;
      // Assuming API returns total count for pagination, otherwise calculate from list length
      pagination.total = res.totalCount || res.list.length;
    } else {
      users.value = [];
      pagination.total = 0;
      throw new Error(res?.message || '获取用户列表失败');
    }
  } catch (err) {
    console.error("获取用户列表失败:", err);
    error.value = err.message || '加载用户数据时出错';
    users.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// Search handler
const handleSearch = () => {
   pagination.current = 1; // Reset to first page on new search
   fetchUsers();
};

// Navigate to user detail
const viewUserDetail = (userId) => {
    if (!userId) return;
    // Ensure you have a named route 'AdminUserDetail' accepting 'id' param
    router.push({ name: 'AdminUserDetail', params: { id: userId } });
};

// Fetch initial data
onMounted(() => {
  fetchUsers();
});

</script>

<style scoped>
.manage-users-container {
  padding: 24px;
}
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}
.loading-indicator, .empty-users, .error-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    width: 100%;
}
.error-indicator .ant-alert {
    max-width: 600px;
}
.users-grid {
    margin-top: 16px; /* Add some space after controls */
}
.user-profile-card {
    cursor: pointer;
    transition: box-shadow 0.3s ease;
}
.user-profile-card:hover {
     box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.user-card-name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.user-card-id {
    font-size: 0.85em;
    color: #888;
    margin-top: 4px;
}
:deep(.ant-card-meta-avatar) {
    padding-right: 12px; /* Space between avatar and text */
}
:deep(.ant-card-body) {
    padding: 16px; /* Adjust padding */
}
</style>
  