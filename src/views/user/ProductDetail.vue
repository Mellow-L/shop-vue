<template>
  <div v-if="product.product_id" class="product-detail-container">
    <a-breadcrumb class="breadcrumb">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <a @click="$router.push('/?category=' + product.product_class)">{{ product.product_class }}</a>
      </a-breadcrumb-item>
      <a-breadcrumb-item>{{ product.product_name }}</a-breadcrumb-item>
    </a-breadcrumb>
    
    <a-row :gutter="32">
      <a-col :span="24" :md="12" :lg="10">
        <div class="product-image-container">
          <img :src="product.product_picture || 'https://placehold.co/600x600?text=No+Image'" :alt="product.product_name" class="product-image" />
        </div>
      </a-col>
      
      <a-col :span="24" :md="12" :lg="14">
        <div class="product-info">
          <h1 class="product-name">{{ product.product_name }}</h1>
          
          <div class="product-likes">
            <like-outlined /> {{ product.like_number || 0 }} 人赞过
          </div>
          
          <div class="product-price-container">
            <div class="product-price">
              <span class="price-label">价格</span>
              <span class="price-value">¥{{ product.product_price }}</span>
            </div>
            <div class="product-tags">
              <a-tag v-if="product.product_stock && product.product_stock > 0" color="green">有货</a-tag>
              <a-tag v-else color="red">无货</a-tag>
            </div>
          </div>
          
          <div class="product-specs">
            <div class="spec-item">
              <span class="spec-label">销量</span>
              <span class="spec-value">{{ product.sale_amount || 0 }}件</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">库存</span>
              <span class="spec-value">{{ product.product_stock === null ? 'N/A' : product.product_stock + '件' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">商品编号</span>
              <span class="spec-value">{{ product.product_id }}</span>
            </div>
          </div>
          
          <a-divider />
          
          <div class="product-options">
            <div class="option-group">
              <div class="option-label">数量</div>
              <div class="option-values">
                <a-input-number 
                  v-model:value="quantity" 
                  :min="1" 
                  :max="product.product_stock || 1"
                  :disabled="!product.product_stock || product.product_stock <= 0"
                />
              </div>
            </div>
          </div>
          
          <div class="product-actions">
            <a-button 
              type="primary" 
              size="large" 
              class="buy-now-btn"
              :disabled="!product.product_stock || product.product_stock <= 0"
              @click="buyNow"
            >
              立即购买
            </a-button>
            <a-button 
              size="large" 
              class="add-to-cart-btn"
              :disabled="!product.product_stock || product.product_stock <= 0"
              @click="addToCart"
            >
              加入购物车
            </a-button>
            <a-button 
              size="large" 
              class="like-btn"
              @click="toggleLike"
            >
              <like-outlined v-if="!isLiked" />
              <like-filled v-else style="color: #1890ff"/>
              {{ isLiked ? '已赞' : '点赞' }} ({{ product.like_number || 0 }})
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
  <div v-else>
    <a-spin size="large" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue-router';
import { LikeOutlined, LikeFilled } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();

// Mock Product Data (Simulating a backend database)
const mockProductDatabase = [
  { product_id: 1, product_name: 'iPhone 15 Pro Max', product_class: '电子产品', product_price: 9999, like_number: 1588, product_stock: 50, sale_amount: 246, product_picture: 'https://placehold.co/600x600?text=iPhone' },
  { product_id: 2, product_name: '轻薄羽绒服', product_class: '服装', product_price: 599, like_number: 765, product_stock: 100, sale_amount: 125, product_picture: 'https://placehold.co/600x600?text=Jacket' },
  { product_id: 3, product_name: '有机水果礼盒', product_class: '食品', product_price: 199, like_number: 432, product_stock: 200, sale_amount: 89, product_picture: 'https://placehold.co/600x600?text=Fruits' },
  { product_id: 4, product_name: '计算机编程入门', product_class: '图书', product_price: 79, like_number: 670, product_stock: null, sale_amount: 106, product_picture: 'https://placehold.co/600x600?text=Book' },
  { product_id: 5, product_name: '智能手表', product_class: '电子产品', product_price: 1599, like_number: 345, product_stock: 30, sale_amount: 78, product_picture: 'https://placehold.co/600x600?text=Watch' },
  { product_id: 6, product_name: '运动跑鞋', product_class: '服装', product_price: 499, like_number: 234, product_stock: 50, sale_amount: 112, product_picture: 'https://placehold.co/600x600?text=Shoes' },
  { product_id: 7, product_name: '有机红茶', product_class: '食品', product_price: 89, like_number: 123, product_stock: 100, sale_amount: 67, product_picture: 'https://placehold.co/600x600?text=Tea' },
  { product_id: 8, product_name: '数据结构与算法', product_class: '图书', product_price: 99, like_number: 567, product_stock: 20, sale_amount: 94, product_picture: 'https://placehold.co/600x600?text=Algorithm' }
];

// Function to simulate fetching product details
const fetchProductById = (id) => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const foundProduct = mockProductDatabase.find(p => p.product_id === parseInt(id));
      resolve(foundProduct);
    }, 300); // 300ms delay
  });
};

// Initialize product as an empty object or null initially
const product = reactive({}); 
const quantity = ref(1);
const isLiked = ref(false);

onMounted(async () => {
  const productId = route.params.id;
  console.log('Fetching product detail for ID:', productId);
  if (productId) {
    const fetchedProduct = await fetchProductById(productId);
    if (fetchedProduct) {
      // Update the reactive object with fetched data
      Object.assign(product, fetchedProduct); 
      console.log('Product data loaded:', product);
    } else {
      console.error('Product not found!');
      message.error('未找到该商品');
      // Optionally redirect to a 404 page or back
      router.replace('/'); 
    }
  } else {
    console.error('No product ID found in route parameters');
    message.error('无效的商品链接');
    router.replace('/');
  }
});

const addToCart = () => {
  if (!product.product_id) return; // Prevent action if product not loaded
  message.success(`已将 ${product.product_name} × ${quantity.value} 加入购物车`);
};

const buyNow = () => {
   if (!product.product_id) return;
  message.success(`正在跳转到结算页面...`);
};

const toggleLike = () => {
   if (!product.product_id) return;
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    product.like_number = (product.like_number || 0) + 1;
    message.success(`已点赞 ${product.product_name}`);
  } else {
    product.like_number = Math.max(0, (product.like_number || 0) - 1);
    message.success(`已取消点赞 ${product.product_name}`);
  }
  // TODO: Add backend API call here
};
</script>

<style scoped>
.product-detail-container {
  padding: 20px;
}

.breadcrumb {
  margin-bottom: 24px;
}

.product-image-container {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #f0f0f0;
  height: 400px;
}

.product-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: none;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.product-likes {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #666;
}

.product-price-container {
  background-color: #f5f5f5;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.price-label {
  margin-right: 12px;
}

.price-value {
  font-size: 24px;
  font-weight: bold;
  color: #f5222d;
  margin-right: 8px;
}

.product-tags {
  margin-top: 8px;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 16px 0;
}

.spec-item {
  display: flex;
  align-items: center;
}

.spec-label {
  color: #999;
  margin-right: 8px;
}

.option-group {
  display: flex;
  margin-bottom: 16px;
  align-items: center;
}

.option-label {
  width: 60px;
  color: #666;
}

.option-values {
  flex: 1;
}

.product-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.buy-now-btn, .add-to-cart-btn, .like-btn {
  flex-grow: 1; /* Allow buttons to grow */
}

.like-btn {
  min-width: 120px; /* Ensure like button has some width */
}

/* Add loading state style */
.product-detail-container[v-else] {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px; /* Ensure spinner is visible */
}
</style>
  