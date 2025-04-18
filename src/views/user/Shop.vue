<template>
  <div class="shop-container">
    <div class="shop-header">
      <h1>商品列表</h1>
      <a-input-search
        v-model:value="searchValue"
        placeholder="搜索商品"
        style="width: 300px"
        @search="onSearch"
      />
      <div class="shop-filters">
        <a-select
          v-model:value="categoryValue"
          style="width: 200px"
          placeholder="商品分类"
          @change="onCategoryChange"
        >
          <a-select-option value="">全部分类</a-select-option>
          <a-select-option value="electronics">电子产品</a-select-option>
          <a-select-option value="clothing">服装</a-select-option>
          <a-select-option value="food">食品</a-select-option>
          <a-select-option value="books">图书</a-select-option>
        </a-select>
        <a-select
          v-model:value="sortValue"
          style="width: 150px"
          placeholder="排序方式"
          @change="onSortChange"
        >
          <a-select-option value="price-asc">价格从低到高</a-select-option>
          <a-select-option value="price-desc">价格从高到低</a-select-option>
          <a-select-option value="rating">评分</a-select-option>
          <a-select-option value="newest">最新上架</a-select-option>
        </a-select>
      </div>
    </div>

    <a-row :gutter="[16, 16]" class="products-grid">
      <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(product) in products" :key="product.product_id">
        <a-card hoverable>
          <template #cover>
            <img :src="product.product_picture || 'https://placehold.co/300x300?text=No+Image'" :alt="product.product_name" class="product-image" />
          </template>
          <template #actions>
            <shopping-cart-outlined key="cart" @click="addToCart(product)" />
            <eye-outlined key="view" @click="viewProduct(product.product_id)" />
            <like-outlined key="like" @click="toggleLike(product.product_id)" />
          </template>
          <a-card-meta :title="product.product_name" :description="`¥${product.product_price}`">
            <template #avatar>
              <a-tag color="blue">{{ product.product_class }}</a-tag>
            </template>
          </a-card-meta>
          <div class="product-likes">
            <like-outlined /> {{ product.like_number || 0 }} 人赞过
          </div>
        </a-card>
      </a-col>
    </a-row>

    <div class="pagination-container">
      <a-pagination
        v-model:current="current"
        :total="100"
        show-size-changer
        @change="onChange"
        @showSizeChange="onShowSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { ShoppingCartOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const searchValue = ref('');
const categoryValue = ref('');
const sortValue = ref('newest');
const current = ref(1);

// 更新模拟商品数据结构以匹配后端
const products = reactive([
  {
    product_id: 1,
    product_name: 'iPhone 16 Pro Max',
    product_price: 9999,
    product_class: '电子产品',
    like_number: 1588,
    sale_amount: 246,
    product_picture: 'https://placehold.co/300x300?text=iPhone',
    product_stock: 50
  },
  {
    product_id: 2,
    product_name: '轻薄羽绒服',
    product_price: 599,
    product_class: '服装',
    like_number: 765,
    sale_amount: 125,
    product_picture: 'https://placehold.co/300x300?text=Yurongfu',
    product_stock: 100
  },
  {
    product_id: 3,
    product_name: '有机水果礼盒',
    product_price: 199,
    product_class: '食品',
    like_number: 432,
    sale_amount: 89,
    product_picture: 'https://placehold.co/300x300?text=Fruits',
    product_stock: 200
  },
  {
    product_id: 4,
    product_name: '计算机编程入门',
    product_price: 79,
    product_class: '图书',
    like_number: 670,
    sale_amount: 106,
    product_picture: 'https://placehold.co/300x300?text=Book',
    product_stock: null // 库存可为空
  },
  {
    product_id: 5,
    product_name: '智能手表',
    product_price: 1599,
    product_class: '电子产品',
    like_number: 345,
    sale_amount: 78,
    product_picture: 'https://placehold.co/300x300?text=Watch',
    product_stock: 30
  },
  {
    product_id: 6,
    product_name: '运动跑鞋',
    product_price: 499,
    product_class: '服装',
    like_number: 234,
    sale_amount: 112,
    product_picture: 'https://placehold.co/300x300?text=Shoes',
    product_stock: 50
  },
  {
    product_id: 7,
    product_name: '咖啡',
    product_price: 89,
    product_class: '食品',
    like_number: 123,
    sale_amount: 67,
    product_picture: 'https://placehold.co/300x300?text=Coffee',
    product_stock: 100
  },
  {
    product_id: 8,
    product_name: '数据结构与算法',
    product_price: 99,
    product_class: '图书',
    like_number: 567,
    sale_amount: 94,
    product_picture: 'https://placehold.co/300x300?text=Algorithm Book',
    product_stock: 20
  }
]);

const onSearch = value => {
  console.log('搜索:', value);
  message.info(`搜索: ${value}`);
};

const onCategoryChange = value => {
  console.log('分类过滤:', value);
};

const onSortChange = value => {
  console.log('排序方式:', value);
};

const onChange = page => {
  console.log('页码改变:', page);
};

const onShowSizeChange = (current, pageSize) => {
  console.log('页码:', current, '每页条数:', pageSize);
};

const addToCart = product => {
  message.success(`${product.product_name} 已添加到购物车`);
};

const viewProduct = id => {
  router.push(`/product/${id}`);
};

// 重命名或调整点赞/收藏逻辑
const toggleLike = id => {
  message.success(`点赞/取消点赞 商品ID: ${id}`); 
  // 这里可以更新产品的 like_number 并调用后端 API
};
</script>

<style scoped>
.shop-container {
  padding: 20px;
}

.shop-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.shop-filters {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.products-grid {
  margin-bottom: 20px;
}

.product-image {
  height: 200px;
  object-fit: cover;
}

.product-likes {
  margin-top: 12px;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-container {
  text-align: center;
  margin: 20px 0;
}

@media (max-width: 768px) {
  .shop-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .shop-filters {
    margin-top: 12px;
    width: 100%;
  }
}
</style>
  