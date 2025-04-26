<template>
  <div class="manage-products-container">
    <div class="header-controls">
      <h1 class="page-title">商品管理</h1>
      <a-button type="primary" @click="showAddModal">
        <PlusOutlined /> 添加商品
      </a-button>
    </div>

    <!-- Search and Filter Controls -->
    <div class="filter-controls">
       <a-select
        v-model:value="categoryValue"
        style="width: 200px; margin-right: 16px;"
        placeholder="商品分类"
        @change="handleFilterChange"
        allowClear
      >
        <a-select-option value="">全部分类</a-select-option>
        <a-select-option value="饮品/乳品">饮品/乳品</a-select-option>
        <a-select-option value="零食/速食">零食/速食</a-select-option>
        <a-select-option value="日用百货">日用百货</a-select-option>
        <a-select-option value="蔬菜水果">蔬菜水果</a-select-option>
        <a-select-option value="生禽肉蛋">生禽肉蛋</a-select-option>
        <a-select-option value="服装服饰">服装服饰</a-select-option>
        <a-select-option value="数码家电">数码家电</a-select-option>
        <a-select-option value="美妆护肤">美妆护肤</a-select-option>
      </a-select>
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索商品名称"
        style="width: 300px"
        enter-button
        @search="handleSearch"
        allowClear
      />
    </div>

    <!-- Loading/Error/Empty States -->
    <div v-if="loading" class="loading-indicator">
       <a-spin size="large" />
    </div>
    <div v-else-if="error" class="error-indicator">
        <a-alert message="加载商品失败" :description="error" type="error" show-icon>
             <template #action>
                <a-button type="primary" @click="fetchProducts">重试</a-button>
             </template>
        </a-alert>
    </div>
    <div v-else-if="products.length === 0" class="empty-products">
        <a-empty description="暂无商品，请添加" />
    </div>

    <!-- Products Grid -->
    <a-list
        v-else
        :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
        :dataSource="products"
        :pagination="pagination"
    >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card hoverable class="product-card">
              <template #cover>
                <img :src="getImageUrl(item.product_picture)" :alt="item.product_name" class="product-image" />
              </template>
              <template #actions>
                <a-tooltip title="修改">
                    <EditOutlined key="edit" @click="showEditModal(item)" />
                </a-tooltip>
                 <a-popconfirm
                    title="确定要删除这个商品吗？"
                    ok-text="确认删除"
                    cancel-text="取消"
                    @confirm="confirmDelete(item.product_id)"
                  >
                    <a-tooltip title="删除">
                        <DeleteOutlined key="delete" style="color: #ff4d4f"/>
                    </a-tooltip>
                 </a-popconfirm>
              </template>
              <a-card-meta>
                 <template #title>
                    <div class="product-title" :title="item.product_name">{{ item.product_name }}</div>
                 </template>
                 <template #description>
                    <div class="product-info">
                        <p>ID: {{ item.product_id }}</p>
                        <p>类别: <a-tag color="blue">{{ item.product_class }}</a-tag></p>
                        <p>价格: <span class="product-price">¥{{ formatPrice(item.product_price) }}</span></p>
                        <p>库存: {{ item.product_stock === null ? 'N/A' : item.product_stock }}</p>
                    </div>
                 </template>
              </a-card-meta>
            </a-card>
          </a-list-item>
        </template>
    </a-list>

    <!-- Add/Edit Product Modal -->
    <a-modal
      :title="isEditing ? '修改商品' : '添加商品'"
      v-model:visible="isModalVisible"
      :confirm-loading="modalConfirmLoading"
      @ok="handleOk"
      @cancel="handleCancel"
      ok-text="确认"
      cancel-text="取消"
      :width="isEditing ? '700px' : '500px'"
      :destroyOnClose="true"
    >
      <a-form
        ref="formRef"
        :model="currentProduct"
        :rules="rules"
        layout="vertical"
        name="product_form"
      >
        <a-row :gutter="24">
          <!-- Left Column: Image Upload (ONLY for Editing) -->
          <a-col v-if="isEditing" :span="8">
            <a-form-item label="商品图片">
              <div class="image-upload-container">
                 <a-avatar :size="140" shape="square" :src="imagePreviewUrl || getImageUrl(currentProduct.product_picture) || 'https://placehold.co/200x200?text=No+Image'" />
                 <a-upload
                    name="product_image"
                    list-type="picture"
                    class="image-uploader-button"
                    :show-upload-list="false"
                    :customRequest="handleImageUploadChange" 
                    :before-upload="beforeImageUpload"
                    :disabled="imageUploading"
                  >
                    <a-button :loading="imageUploading" style="margin-top: 10px;">
                       <UploadOutlined /> {{ imageUploading ? '上传中...' : '选择图片' }}
                    </a-button>
                  </a-upload>
              </div>
            </a-form-item>
          </a-col>

          <!-- Right Column: Form Fields (Full width if not editing) -->
          <a-col :span="isEditing ? 16 : 24">
            <a-form-item label="商品名称" name="product_name">
              <a-input v-model:value="currentProduct.product_name" placeholder="请输入商品名称" />
            </a-form-item>
            <a-row :gutter="16">
               <a-col :span="12">
                   <a-form-item label="价格" name="product_price">
                       <a-input-number v-model:value="currentProduct.product_price" :min="0" addon-before="¥" style="width: 100%" placeholder="请输入价格"/>
                   </a-form-item>
               </a-col>
                <a-col :span="12">
                   <a-form-item label="库存" name="product_stock">
                        <a-input-number v-model:value="currentProduct.product_stock" :min="0" style="width: 100%" placeholder="请输入库存"/>
                   </a-form-item>
                </a-col>
            </a-row>
             <a-form-item label="商品类别" name="product_class">
              <a-select
                v-model:value="currentProduct.product_class"
                placeholder="请选择商品类别"
                allowClear
              >
                <a-select-option value="饮品/乳品">饮品/乳品</a-select-option>
                <a-select-option value="零食/速食">零食/速食</a-select-option>
                <a-select-option value="日用百货">日用百货</a-select-option>
                <a-select-option value="蔬菜水果">蔬菜水果</a-select-option>
                <a-select-option value="生禽肉蛋">生禽肉蛋</a-select-option>
                <a-select-option value="服装服饰">服装服饰</a-select-option>
                <a-select-option value="数码家电">数码家电</a-select-option>
                <a-select-option value="美妆护肤">美妆护肤</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    </div>
  </template>
  
  <script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { message, Spin, Empty, Button, List, Card, CardMeta, Tag, Modal, Form, FormItem, Input, InputNumber, Textarea, Popconfirm, Tooltip, Upload, Alert, Row, Col, Avatar, Select, SelectOption, InputSearch } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue';
// ---- Assume these API functions exist in @/api/product.js ----
// You MUST create or adjust these functions based on your actual backend API
import { apiFindAllProducts, apiAddProduct, apiUpdateProduct, apiDeleteProduct, apiAddProductPicture, apiFindProductsByClass, apiSearchProducts } from '@/api/product';
// --------------------------------------------------------------
import apiConfig from '@/config/api'; // For image URL construction

const products = ref([]);
const loading = ref(false);
const error = ref(null);
const isModalVisible = ref(false);
const isEditing = ref(false);
const modalConfirmLoading = ref(false);
const currentProduct = ref({}); // Use ref for reactivity in the form
const formRef = ref();

// Image Upload State
const imagePreviewUrl = ref('');
const currentImageFile = ref(null);
const imageUploading = ref(false); // Separate loading state for image selection/preview

// Added: Refs for filters
const categoryValue = ref('');
const searchValue = ref('');

const pagination = reactive({
  current: 1,
  pageSize: 12, // Adjust page size as needed
  total: 0,
  onChange: (page, pageSize) => {
    pagination.current = page;
    // fetchProducts(); // Uncomment if using server-side pagination
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
   // Show total count
  showTotal: total => `共 ${total} 条`,
  // Allow changing page size
  showSizeChanger: true,
  pageSizeOptions: ['12', '24', '36', '48'],
});

// Form validation rules
const rules = {
  product_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  product_class: [{ required: true, message: '请选择商品类别', trigger: 'change' }],
  product_price: [{ required: true, type: 'number', message: '请输入有效的商品价格', trigger: 'change' }],
  product_stock: [{ required: true, type: 'number', message: '请输入有效的商品库存', trigger: 'change' }],
};

// --- Watchers ---
// Reset pagination when filters change
watch([categoryValue, searchValue], () => {
  pagination.current = 1;
});

// --- Core Logic ---
// Modified fetchProducts to handle filters
const fetchProducts = async () => {
  loading.value = true;
  error.value = null; // Reset error before fetching
  const params = {}; 

  let apiCall;
  if (categoryValue.value) {
      console.log(`Fetching products by class: ${categoryValue.value}`);
      apiCall = () => apiFindProductsByClass(categoryValue.value, params);
  } else if (searchValue.value) {
      console.log(`Searching products by name: ${searchValue.value}`);
      apiCall = () => apiSearchProducts(searchValue.value, params);
  } else {
      console.log("Fetching all products");
      apiCall = () => apiFindAllProducts(params);
  }

  try {
    const res = await apiCall();
    if (res && res.code === 200 && Array.isArray(res.list)) {
      products.value = res.list;
      pagination.total = res.list.length;

      // --- ADDED LOGGING --- 
      console.log("[fetchProducts] Data fetched successfully. Products:", JSON.parse(JSON.stringify(products.value)));
      // If you recently added a product, find it and log its picture path:
      if (window.lastAddedProductId) { // Temporary global flag for debugging
          const addedProd = products.value.find(p => p.product_id === window.lastAddedProductId);
          console.log(`[fetchProducts] Picture path for recently added product (ID: ${window.lastAddedProductId}):`, addedProd?.product_picture);
          delete window.lastAddedProductId; // Clean up the flag
      }
      // --- END LOGGING --- 

    } else {
      products.value = [];
      pagination.total = 0;
      throw new Error(res?.message || `获取商品列表失败`);
    }
  } catch (err) {
    console.error("[ManageProducts] 获取商品列表失败:", err);
    // --- MODIFIED ERROR HANDLING --- 
    // Check if the error is an Axios error with a 404 status
    if (err.isAxiosError && err.response?.status === 404) {
      console.log("[ManageProducts] Received 404 Not Found from API.");
      // Set products to empty array to trigger the empty state display
      products.value = [];
      pagination.total = 0;
      // Ensure no generic error message is shown in the Alert component
      error.value = null; 
    } else {
      // For other errors, show the error message in the Alert component
      // API function likely already showed a message via showFail
      error.value = err.message || '加载商品数据时出错';
      products.value = []; // Also clear products on other errors
      pagination.total = 0;
    }
    // --- END MODIFIED ERROR HANDLING ---
  } finally {
    loading.value = false;
  }
};

// Get image URL helper with added logging
const getImageUrl = (relativePath) => {
  // --- ADDED LOGGING --- 
  console.log(`[getImageUrl] Input relativePath:`, relativePath);
  // --- END LOGGING --- 
  let finalUrl = 'https://placehold.co/300x200/EEE/AAA?text=暂无图片'; // Default placeholder
  if (relativePath) {
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        finalUrl = relativePath;
    } else {
        const baseUrl = apiConfig.BASE_URL.endsWith('/') ? apiConfig.BASE_URL : apiConfig.BASE_URL + '/';
        const imagePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
        finalUrl = baseUrl + imagePath;
    }
  } 
  // --- ADDED LOGGING --- 
  console.log(`[getImageUrl] Output finalUrl:`, finalUrl);
  // --- END LOGGING --- 
  return finalUrl;
};

// Format price helper
const formatPrice = (price) => {
    if (typeof price === 'number') {
        return price.toFixed(2);
    }
    // Handle cases where price might be a string representation of a number
    const num = parseFloat(price);
    if (!isNaN(num)) {
        return num.toFixed(2);
    }
    return '0.00';
}

// --- Image Upload Handling --- 
const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
};

const beforeImageUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) message.error('只能上传 JPG/PNG 格式!');
  const isLt5M = file.size / 1024 / 1024 < 5; // Increased limit to 5MB
  if (!isLt5M) message.error('图片需小于 5MB!');
  return isJpgOrPng && isLt5M;
};

// Modified: Add logging to confirm path stored
const handleImageUploadChange = async (info) => {
    const file = info.file;
    console.log("Image selected:", file);

    if (beforeImageUpload(file)) {
        getBase64(file, base64Url => {
            imagePreviewUrl.value = base64Url;
        });
        currentImageFile.value = file;

        if (isEditing.value && currentProduct.value?.product_id) {
            imageUploading.value = true;
            try {
                 const res = await apiAddProductPicture(currentProduct.value.product_id, file);

                 // Check response structure based on previous error
                 if (res && res.code === 200 && res.product?.product_picture) {
                     const newRelativePath = res.product.product_picture;
                     // --- ADDED LOGGING --- 
                     console.log(`[handleImageUploadChange] Success. Storing relative path in currentProduct.product_picture: "${newRelativePath}"`);
                     // --- END LOGGING --- 
                     currentProduct.value.product_picture = newRelativePath;
                     currentImageFile.value = null; 
                     imagePreviewUrl.value = ''; // Clear preview, rely on getImageUrl
                 } else {
                     console.error("Image upload API call did not return success code or product.product_picture path:", res);
                     imagePreviewUrl.value = ''; 
                     currentImageFile.value = null; 
                 }
            } catch (err) {
                console.error("Immediate image upload failed (catch block):", err);
                imagePreviewUrl.value = ''; 
                currentImageFile.value = null; 
            } finally {
                imageUploading.value = false;
            }
        } else {
            console.log("Add mode: Image file stored for later upload.");
        }
    } else {
        imagePreviewUrl.value = '';
        currentImageFile.value = null;
    }
};

// --- Modal Actions ---\n
const resetForm = () => {
    currentProduct.value = {
      product_name: '',
      product_class: '',
      product_price: null,
      product_stock: null,
      product_picture: ''
    };
    imagePreviewUrl.value = ''; // Clear image preview
    currentImageFile.value = null; // Clear selected file
     nextTick(() => {
       formRef.value?.clearValidate();
     });
};

const showAddModal = () => {
  isEditing.value = false;
  resetForm();
  isModalVisible.value = true;
};

const showEditModal = (product) => {
  isEditing.value = true;
  // Create a copy to edit, parse numbers correctly
  currentProduct.value = {
      ...product,
      product_price: typeof product.product_price === 'string' ? parseFloat(product.product_price) : product.product_price,
      product_stock: typeof product.product_stock === 'string' ? parseInt(product.product_stock, 10) : product.product_stock,
  };
  imagePreviewUrl.value = ''; // Clear any previous preview
  currentImageFile.value = null; // Clear any selected file from previous modal opening
  isModalVisible.value = true;
   nextTick(() => { // Ensure formRef is available
       formRef.value?.clearValidate();
   });
};

const handleCancel = () => {
  isModalVisible.value = false;
  // No need to clear form here if using destroyOnClose: true on Modal
};

const handleOk = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate(); 
    modalConfirmLoading.value = true;

    const productData = {
        ...currentProduct.value,
        product_price: Number(currentProduct.value.product_price),
        product_stock: Number(currentProduct.value.product_stock),
    };

    let primaryOperationSuccess = false;

    if (isEditing.value) {
        // --- EDIT INFO --- 
        // Image upload is handled immediately by handleImageUploadChange
        console.log("[handleOk Edit] Updating product info:", productData);
        const updateInfoRes = await apiUpdateProduct(productData);
        if (updateInfoRes && updateInfoRes.code === 200) {
            primaryOperationSuccess = true;
        } else { 
             // API func shows error
        }
    } else {
        // --- ADD INFO ONLY (No Image Upload Here) --- 
        const dataToAdd = { ...productData };
        delete dataToAdd.product_id; // Remove potential id from copied data
        delete dataToAdd.product_picture; // Ensure no picture path is sent initially

        console.log("[handleOk Add] Adding product info (without image):", dataToAdd);
        let addInfoRes;
        try {
            addInfoRes = await apiAddProduct(dataToAdd);
            if (addInfoRes && addInfoRes.code === 200) {
                primaryOperationSuccess = true; 
                console.log("[handleOk Add] Product info added successfully.");
                // No need to check for product_id or upload image here anymore
            } else {
                 primaryOperationSuccess = false; 
                 console.error("[handleOk Add] apiAddProduct failed:", addInfoRes);
                 // API func shows error
            }
        } catch (addError) {
             primaryOperationSuccess = false; 
             console.error("[handleOk Add] Error during apiAddProduct call:", addError);
             // API func shows error
        }
    }

    // --- Final Outcome --- 
    if (primaryOperationSuccess) {
        isModalVisible.value = false;
        // Refresh list after successful add or edit
        // No delay needed now as secondary image upload is removed from add flow
        fetchProducts(); 
        message.success(isEditing.value ? '商品更新成功！' : '商品添加成功！');
    } 
    // If primaryOperationSuccess is false, modal stays open, error shown by API func

  } catch (validationError) {
      if (validationError?.errorFields) {
          message.warning('请检查表单输入项！');
      }
  } finally {
      modalConfirmLoading.value = false;
  }
};

// --- Delete Action ---\n
const confirmDelete = async (productId) => {
    if (!productId) {
        message.error('无效的商品ID');
        return;
    }
    try {
        console.log("Deleting product:", productId);
        // --- Replace with actual API call ---
        // Ensure apiDeleteProduct handles the productId correctly
        await apiDeleteProduct(productId);
        // ------------------------------------\
        message.success('商品删除成功！');
        fetchProducts(); // Refresh list
    } catch (error) {
        console.error("删除商品失败:", error);
        message.error(error.message || '删除失败，请重试');
    }
};

// Added: Filter/Search Handlers
const handleFilterChange = () => {
  fetchProducts();
};

const handleSearch = () => {
   fetchProducts();
};

// Fetch initial data
onMounted(() => {
  fetchProducts();
});
  
  </script>
  
  <style scoped>
.manage-products-container {
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

.loading-indicator, .empty-products, .error-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    width: 100%;
}

.error-indicator .ant-alert {
    max-width: 600px;
}

.product-card {
    cursor: default;
    transition: box-shadow 0.3s ease;
    display: flex; /* Use flexbox for card layout */
    flex-direction: column; /* Stack elements vertically */
    height: 100%; /* Make card fill list item height */
}
.product-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.product-image {
  height: 180px; /* Slightly smaller image */
  width: 100%;
  object-fit: cover;
  background-color: #f0f0f0;
  display: block; /* Remove extra space below image */
}

:deep(.ant-card-body) {
    padding: 16px; /* Adjust card body padding */
    flex-grow: 1; /* Allow body to grow */
    display: flex;
    flex-direction: column;
}

.product-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 8px;
    font-size: 1em;
    font-weight: 500; /* Make title slightly bolder */
}

.product-info {
    flex-grow: 1; /* Allow info section to take remaining space */
    margin-bottom: 10px; /* Add space before actions */
}

.product-info p {
    margin-bottom: 4px;
    font-size: 0.85em; /* Slightly smaller info text */
    color: #555; /* Darker gray */
    line-height: 1.4;
    /* No text overflow needed if card height is sufficient */
}

.product-price {
    color: #c0392b; /* Darker red */
    font-weight: 500;
    font-size: 0.9em;
}

:deep(.ant-card-actions) {
    margin-top: auto; /* Push actions to the bottom */
    padding: 0;
    background: #fafafa; /* Lighter background for actions */
}
:deep(.ant-card-actions > li) {
    margin: 10px 0 !important; /* Adjust action item margin */
    text-align: center;
}
:deep(.ant-card-actions > li > span) {
    cursor: pointer;
    color: rgba(0, 0, 0, 0.65); /* Default action color */
    transition: color 0.3s;
}
:deep(.ant-card-actions > li > span:hover) {
     color: #1890ff; /* Hover color */
}
:deep(.ant-card-actions > li > span .anticon) {
     font-size: 16px;
}
/* Ensure delete icon hover is red */
:deep(.ant-card-actions > li > span:has(.anticon-delete):hover) {
     color: #ff4d4f;
}


/* Modal form layout */
:deep(.ant-modal-body) {
    padding-bottom: 0;
}
:deep(.ant-form-item) {
    margin-bottom: 16px; /* Adjust form item spacing */
}

/* Ensure list items have consistent height if grid layout causes issues */
:deep(.ant-list-item) {
    height: 100%;
}

/* Styles for Image Upload */
.image-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.image-uploader-button .ant-btn {
    margin-top: 10px;
}

/* Added: Styles for filter controls */
.filter-controls {
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap; 
  gap: 16px;      
}

  </style>
  