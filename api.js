/**
 * 🔗 ملف معالجة طلبات Firebase API
 * جميع العمليات مع قاعدة البيانات تتم هنا
 */

class FirebaseAPI {
  constructor() {
    this.baseURL = CONFIG.FIREBASE_BASE_URL;
    this.timeout = CONFIG.FETCH_TIMEOUT || 10000;
  }

  /**
   * بناء رابط API
   */
  buildURL(path) {
    return `${this.baseURL}/${path}.json`;
  }

  /**
   * معالجة طلب مع timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ==================== المنتجات ====================

  /**
   * جلب جميع المنتجات
   */
  async getProducts() {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL('products')
      );
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json() || {};
    } catch (error) {
      logError(error, 'getProducts');
      throw error;
    }
  }

  /**
   * جلب منتج واحد
   */
  async getProduct(productId) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`products/${productId}`)
      );
      if (!response.ok) throw new Error('Product not found');
      return await response.json();
    } catch (error) {
      logError(error, 'getProduct');
      throw error;
    }
  }

  /**
   * إضافة منتج جديد
   */
  async addProduct(productData) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`products/${productData.id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        }
      );
      if (!response.ok) throw new Error('Failed to add product');
      return await response.json();
    } catch (error) {
      logError(error, 'addProduct');
      throw error;
    }
  }

  /**
   * تحديث منتج
   */
  async updateProduct(productId, updates) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`products/${productId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      if (!response.ok) throw new Error('Failed to update product');
      return await response.json();
    } catch (error) {
      logError(error, 'updateProduct');
      throw error;
    }
  }

  /**
   * حذف منتج
   */
  async deleteProduct(productId) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`products/${productId}`),
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete product');
      return true;
    } catch (error) {
      logError(error, 'deleteProduct');
      throw error;
    }
  }

  // ==================== الطلبات ====================

  /**
   * جلب جميع الطلبات
   */
  async getOrders() {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL('orders')
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json() || {};
    } catch (error) {
      logError(error, 'getOrders');
      throw error;
    }
  }

  /**
   * جلب طلب واحد
   */
  async getOrder(orderId) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`orders/${orderId}`)
      );
      if (!response.ok) throw new Error('Order not found');
      return await response.json();
    } catch (error) {
      logError(error, 'getOrder');
      throw error;
    }
  }

  /**
   * إضافة طلب جديد
   */
  async addOrder(orderData) {
    try {
      // إضافة بيانات إضافية
      const enhancedOrder = {
        ...orderData,
        orderId: orderData.orderId || 'ORD_' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'قيد الانتظار'
      };

      const response = await this.fetchWithTimeout(
        this.buildURL(`orders/${enhancedOrder.orderId}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enhancedOrder)
        }
      );
      if (!response.ok) throw new Error('Failed to add order');
      return await response.json();
    } catch (error) {
      logError(error, 'addOrder');
      throw error;
    }
  }

  /**
   * تحديث حالة الطلب
   */
  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`orders/${orderId}`),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, updatedAt: new Date().toISOString() })
        }
      );
      if (!response.ok) throw new Error('Failed to update order status');
      return await response.json();
    } catch (error) {
      logError(error, 'updateOrderStatus');
      throw error;
    }
  }

  /**
   * حذف طلب
   */
  async deleteOrder(orderId) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`orders/${orderId}`),
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete order');
      return true;
    } catch (error) {
      logError(error, 'deleteOrder');
      throw error;
    }
  }

  // ==================== التقييمات ====================

  /**
   * إضافة تقييم
   */
  async addReview(reviewData) {
    try {
      const reviewId = 'REV_' + Date.now();
      const response = await this.fetchWithTimeout(
        this.buildURL(`reviews/${reviewId}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...reviewData,
            createdAt: new Date().toISOString()
          })
        }
      );
      if (!response.ok) throw new Error('Failed to add review');
      return await response.json();
    } catch (error) {
      logError(error, 'addReview');
      throw error;
    }
  }

  /**
   * جلب تقييمات منتج
   */
  async getProductReviews(productId) {
    try {
      const response = await this.fetchWithTimeout(
        this.buildURL(`reviews?orderBy="productId"&equalTo="${productId}"`)
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return await response.json() || {};
    } catch (error) {
      logError(error, 'getProductReviews');
      return {};
    }
  }

  // ==================== الإحصائيات ====================

  /**
   * إضافة حدث إحصائي
   */
  async logEvent(eventName, eventData) {
    try {
      const eventId = 'EVT_' + Date.now();
      await this.fetchWithTimeout(
        this.buildURL(`analytics/${eventId}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: eventName,
            data: eventData,
            timestamp: new Date().toISOString()
          })
        }
      );
    } catch (error) {
      console.warn('Failed to log event:', error);
    }
  }
}

// إنشاء instance واحد للاستخدام في كل مكان
const firebaseAPI = new FirebaseAPI();
