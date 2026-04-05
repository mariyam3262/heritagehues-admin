<template>
  <main v-if="!authResolved" class="auth-loading">Checking admin session...</main>
  <AdminLoginPage
    v-else-if="!isAuthenticated"
    :error="authError"
    :loading="authLoading"
    @login="handleLogin"
  />
  <div v-else class="admin-shell">
    <aside class="sidebar">
      <h1>Heritage Hues</h1>
      <p class="tag">Admin Panel</p>
      <nav>
        <a :class="{ active: currentPage === 'dashboard' }" href="#/dashboard">Dashboard</a>
        <a :class="{ active: currentPage === 'list' }" href="#/products">Products</a>
        <a :class="{ active: currentPage === 'contacts' }" href="#/contacts">Messages</a>
        <a :class="{ active: currentPage === 'reviews' }" href="#/reviews">Reviews</a>
        <a :class="{ active: currentPage === 'users' }" href="#/users">Users</a>
        <a :class="{ active: currentPage === 'order-list' || currentPage === 'order-detail' }" href="#/orders">Orders</a>
        <a :class="{ active: currentPage === 'payments' }" href="#/payments">Payments</a>
        <a :class="{ active: currentPage === 'settings' }" href="#/settings">Settings</a>
      </nav>
    </aside>

    <main class="content">
      <header class="topbar">
        <h2>{{ pageTitle }}</h2>
        <div class="topbar-meta">
          <span v-if="adminProfile?.name" class="admin-pill">{{ adminProfile.name }}</span>
          <button type="button" class="secondary-btn" @click="handleLogout" :disabled="authLoading">Logout</button>
        </div>
        <div v-if="currentPage === 'list'" class="topbar-actions">
          <button type="button" @click="loadProducts" :disabled="loading">Refresh</button>
          <button type="button" class="plus-btn" @click="goToAdd" aria-label="Add product">+</button>
        </div>
        <div v-else-if="currentPage === 'order-list'" class="topbar-actions">
          <button type="button" @click="loadAllOrders" :disabled="loading">Refresh</button>
        </div>
        <div v-else-if="currentPage === 'order-detail'" class="topbar-actions">
          <button type="button" class="secondary-btn" @click="goToOrders">Back to Orders</button>
        </div>
        <div v-else-if="currentPage === 'contacts'" class="topbar-actions">
          <button type="button" @click="loadContacts" :disabled="loading">Refresh</button>
        </div>
        <div v-else-if="currentPage === 'reviews'" class="topbar-actions">
          <button type="button" @click="loadReviews" :disabled="loading">Refresh</button>
        </div>
        <div v-else-if="currentPage === 'users'" class="topbar-actions">
          <button type="button" @click="loadUsers" :disabled="loading">Refresh</button>
        </div>
        <div v-else-if="currentPage === 'payments'" class="topbar-actions">
          <button type="button" @click="loadOrders" :disabled="loading">Refresh</button>
        </div>
        <div v-else-if="currentPage === 'settings'" class="topbar-actions">
          <button type="button" @click="loadPricingSettings" :disabled="settingsLoading">Refresh</button>
        </div>
      </header>

      <p v-if="error" class="status error">{{ error }}</p>
      <p v-if="success" class="status success">{{ success }}</p>

      <section v-if="currentPage === 'dashboard'" class="panel">
        <h3>Welcome Back</h3>
        <div class="detail-grid">
          <p><span>Products</span><strong>{{ products.length }}</strong></p>
          <p><span>Orders</span><strong>{{ allOrders.length }}</strong></p>
          <p><span>Users</span><strong>{{ users.length }}</strong></p>
          <p><span>Messages</span><strong>{{ contacts.length }}</strong></p>
        </div>
      </section>

      <section v-else-if="currentPage === 'order-list'" class="panel">
        <h3>Orders ({{ allOrders.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="allOrders.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No orders yet</p>
          <p class="empty-note">Orders will appear here as customers start checking out.</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in allOrders" :key="order.id">
              <td>{{ order.order_ref }}</td>
              <td>{{ order.address?.name || 'N/A' }}</td>
              <td>{{ formatPrice(order.total_amount) }}</td>
              <td>
                <span class="status-chip" :class="statusTone(order.status)">{{ statusLabel(order.status) }}</span>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <button type="button" @click="goToOrderDetail(order)">View</button>
                <button type="button" class="danger" @click="handleSoftDeleteOrder(order)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="currentPage === 'order-detail'" class="panel form-panel">
        <div v-if="loading" class="status">Loading order...</div>
        <div v-else-if="!selectedOrder" class="empty-products">
          <p class="empty-title">Order not found</p>
          <button type="button" class="secondary-btn" @click="goToOrders">Back to Orders</button>
        </div>
        <div v-else class="order-detail-layout">
          <section class="form-section">
            <div class="section-heading">
              <h3>Order Detail</h3>
              <p>Update fulfillment status, add notes, and manage tracking details.</p>
            </div>
            <div class="detail-grid">
              <p><span>Order ID</span><strong>{{ selectedOrder.order_ref }}</strong></p>
              <p><span>Customer</span><strong>{{ selectedOrder.address?.name || 'N/A' }}</strong></p>
              <p><span>Total</span><strong>{{ formatPrice(selectedOrder.total_amount) }}</strong></p>
              <p><span>Created</span><strong>{{ formatDate(selectedOrder.created_at) }}</strong></p>
            </div>

            <div class="field-grid">
              <label>
                Status
                <select v-model="orderStatusForm.status">
                  <option v-for="status in availableStatusOptions" :key="status" :value="status">
                    {{ statusLabel(status) }}
                  </option>
                </select>
              </label>

              <label>
                Tracking ID
                <input v-model.trim="orderStatusForm.tracking_id" type="text" placeholder="Courier tracking ID" />
              </label>

              <label class="full-field">
                Tracking URL
                <input v-model.trim="orderStatusForm.tracking_url" type="url" placeholder="https://courier.example/track/..." />
              </label>

              <label class="full-field">
                Note
                <textarea v-model.trim="orderStatusForm.note" rows="3" placeholder="Optional internal note for this status update"></textarea>
              </label>
            </div>

            <div class="form-actions">
              <button type="button" :disabled="loading" @click="saveOrderStatus">Save Status</button>
              <button type="button" class="danger" :disabled="loading" @click="handleSoftDeleteOrder(selectedOrder)">Delete Order</button>
              <button type="button" class="secondary-btn" :disabled="loading" @click="goToOrders">Back to Orders</button>
            </div>
          </section>

          <aside class="form-side">
            <section class="helper-panel">
              <div class="section-heading">
                <h3>Status History</h3>
                <p>Every status change is recorded automatically.</p>
              </div>
              <div v-if="selectedOrder.status_history?.length" class="timeline">
                <article v-for="entry in selectedOrder.status_history" :key="`${entry.status}-${entry.timestamp}`" class="timeline-item">
                  <span class="timeline-dot" :class="statusTone(entry.status)"></span>
                  <div>
                    <p class="timeline-title">
                      <strong>{{ statusLabel(entry.status) }}</strong>
                      <small>{{ formatDate(entry.timestamp) }}</small>
                    </p>
                    <p v-if="entry.note" class="subtle-line">{{ entry.note }}</p>
                  </div>
                </article>
              </div>
              <p v-else class="subtle-line">No status history available yet.</p>
            </section>
          </aside>
        </div>
      </section>

      <section v-else-if="currentPage === 'reviews'" class="panel">
        <h3>Product Reviews ({{ reviews.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="reviews.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No reviews yet</p>
          <p class="empty-note">Customer reviews submitted through the product pages will appear here.</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Product</th>
              <th>Name</th>
              <th>Email</th>
              <th>Rating</th>
              <th>Message</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in reviews" :key="review.id">
              <td>{{ review.product_title || review.product_slug }}</td>
              <td>{{ review.name }}</td>
              <td>{{ review.email }}</td>
              <td>{{ review.rating }} / 5</td>
              <td><div class="message-cell">{{ review.message }}</div></td>
              <td>{{ formatDate(review.created_at) }}</td>
              <td>
                <button type="button" class="danger" @click="handleDeleteReview(review)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="currentPage === 'users'" class="panel">
        <h3>Registered Users ({{ users.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="users.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No users found</p>
          <p class="empty-note">Users who sign in from the storefront will appear here.</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Reviews</th>
              <th>Orders</th>
              <th>Last Seen</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.email">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.address || 'Not provided' }}</td>
              <td>{{ user.review_count || 0 }}</td>
              <td>{{ user.order_count || 0 }}</td>
              <td>{{ formatDate(user.last_seen_at || user.joined_at) }}</td>
              <td>
                <button type="button" class="danger" @click="handleDeleteUser(user)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-else-if="currentPage === 'contacts'" class="panel">
        <h3>Contact Messages ({{ contacts.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="contacts.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No contact messages yet</p>
          <p class="empty-note">Messages submitted through the contact form will appear here.</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="message in contacts" :key="message.id">
              <td>{{ message.name }}</td>
              <td>{{ message.email }}</td>
              <td><div class="message-cell">{{ message.message }}</div></td>
              <td>{{ formatDate(message.created_at) }}</td>
              <td>
                <button type="button" class="danger" @click="handleDeleteContact(message)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section v-else-if="currentPage === 'payments'" class="panel">
        <h3>Pending UPI Payments ({{ pendingOrders.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="pendingOrders.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No payments waiting for review</p>
          <p class="empty-note">Submitted UPI transaction IDs will appear here for manual approval.</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Order</th>
              <th>Amount</th>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in pendingOrders" :key="order.id">
              <td>
                <strong>{{ order.order_ref }}</strong>
                <div class="subtle-line">{{ order.status }}</div>
              </td>
              <td>{{ formatPrice(order.total_amount) }}</td>
              <td>{{ order.transaction_id || 'Not submitted' }}</td>
              <td>
                <div>{{ order.address?.name || 'N/A' }}</div>
                <div class="subtle-line">{{ order.address?.phone || '' }}</div>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <button type="button" :disabled="loading" @click="approvePayment(order)">Approve</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <PricingSettingsPanel
        v-else-if="currentPage === 'settings'"
        :settings="pricingSettings"
        :settingsLoading="settingsLoading"
        @save="savePricingRules"
      />

      <section v-else-if="currentPage === 'edit' || currentPage === 'new'" class="panel form-panel">
        <form class="product-form" @submit.prevent="handleSave">
          <div class="product-form-layout">
            <div class="form-main">
              <section class="form-section">
                <div class="section-heading">
                  <h3>Basic Details</h3>
                  <p>Set the main identity used across the storefront.</p>
                </div>
                <div class="field-grid">
                  <label>
                    Title
                    <input v-model.trim="form.title" type="text" required placeholder="Sunlit Maroon Drape" />
                  </label>

                  <label>
                    Slug (auto)
                    <input :value="generatedSlug" type="text" readonly />
                  </label>

                  <label>
                    Category
                    <select v-model="form.category" required>
                      <option value="" disabled>Select category</option>
                      <option v-for="category in categoryOptions" :key="category" :value="category">
                        {{ category }}
                      </option>
                    </select>
                  </label>
                </div>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <h3>Pricing</h3>
                  <p>Enter source values. Final selling numbers are calculated automatically.</p>
                </div>
                <div class="field-grid">
                  <label>
                    Cost Price (INR)
                    <input v-model.number="form.cost_price" type="number" min="0" step="0.01" placeholder="2000" required />
                  </label>

                  <label>
                    Packaging Cost (INR)
                    <input v-model.number="form.packaging_cost" type="number" min="0" step="0.01" placeholder="60" required />
                  </label>

                  <label>
                    Delivery Cost (INR)
                    <input v-model.number="form.delivery_cost" type="number" min="0" step="0.01" placeholder="100" required />
                  </label>

                  <label>
                    Discount (%)
                    <input v-model.number="form.discount_percentage" type="number" min="0" max="100" step="0.1" placeholder="10" />
                  </label>
                </div>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <h3>Inventory</h3>
                  <p>Manage availability and stock visibility from one place.</p>
                </div>
                <div class="field-grid">
                  <label>
                    Stock Count
                    <input v-model.number="form.stock_count" type="number" min="0" required placeholder="12" />
                  </label>

                  <label class="checkbox-card">
                    <span>Availability Override</span>
                    <div class="checkbox-row">
                      <input v-model="form.is_out_of_stock" type="checkbox" />
                      <span>Mark as out of stock</span>
                    </div>
                  </label>
                </div>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <h3>Content</h3>
                  <p>Write the product description and supporting selling points.</p>
                </div>

                <label class="full-field">
                  Description
                  <textarea v-model.trim="form.description" rows="4" placeholder="Describe the product"></textarea>
                </label>

                <label class="full-field">
                  Description Points (bullets)
                  <div class="bullets-manager">
                    <div v-for="(bullet, index) in form.description_points" :key="index" class="bullet-item">
                      <input v-model="bullet.point" placeholder="e.g. Hand-tied by rural artisans" />
                      <button type="button" class="remove-bullet" @click="removeBullet(index)">x</button>
                    </div>
                    <button type="button" class="add-bullet" @click="addBullet">+ Add Bullet Point</button>
                  </div>
                </label>
              </section>

              <section class="form-section">
                <div class="section-heading">
                  <h3>Media</h3>
                  <p>Upload up to 10 images. New uploads replace the current gallery.</p>
                </div>

                <label class="full-field">
                  Photos (maximum 10 files)
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple @change="handlePhotoSelection" />
                </label>

                <div class="photo-note">
                  <p>Selected: {{ selectedPhotoNames.length ? selectedPhotoNames.join(', ') : 'No new files selected' }}</p>
                  <p>Existing: {{ form.photos.length ? `${form.photos.length} uploaded photo(s)` : 'No uploaded photos' }}</p>
                </div>
              </section>

              <div class="form-actions">
                <button type="submit" class="submit-btn" :disabled="loading">
                  {{ currentPage === 'edit' ? 'Update Product' : 'Save Product' }}
                </button>
                <button type="button" class="secondary-btn" :disabled="loading" @click="goToList">Back to List</button>
              </div>
            </div>

            <aside class="form-side">
              <section class="preview-panel">
                <div class="section-heading preview-heading">
                  <h3>Pricing Summary</h3>
                  <p>Live backend-calculated numbers for the current inputs.</p>
                </div>
                <p v-if="previewLoading" class="preview-loading">Calculating...</p>
                <template v-else>
                  <div class="preview-highlight">
                    <span>Final Price</span>
                    <strong>{{ formatPrice(preview.final_price || 0) }}</strong>
                  </div>
                  <div class="preview-grid">
                    <p><span>Total Cost</span><strong>{{ formatPrice(preview.total_cost || 0) }}</strong></p>
                    <p><span>MRP</span><strong>{{ formatPrice(preview.mrp || 0) }}</strong></p>
                    <p><span>Discount</span><strong>{{ formatPrice(preview.discount_amount || 0) }}</strong></p>
                    <p><span>Discounted</span><strong>{{ formatPrice(preview.discounted_price || 0) }}</strong></p>
                    <p><span>GST</span><strong>{{ formatPrice(preview.gst_amount || 0) }}</strong></p>
                    <p><span>Profit</span><strong>{{ formatPrice(preview.profit || 0) }}</strong></p>
                    <p><span>Cost Price</span><strong>{{ formatPrice(preview.cost_price || 0) }}</strong></p>
                    <p><span>Packaging</span><strong>{{ formatPrice(preview.packaging_cost || 0) }}</strong></p>
                    <p><span>Delivery</span><strong>{{ formatPrice(preview.delivery_cost || 0) }}</strong></p>
                  </div>
                  <p class="margin-line" :class="marginStatus">
                    Margin <strong>{{ Number(preview.margin_percentage || 0).toFixed(1) }}%</strong>
                  </p>
                </template>
              </section>

              <section class="helper-panel">
                <h3>Editing Notes</h3>
                <ul>
                  <li>Final price cannot be edited manually.</li>
                  <li>Discount is applied before GST.</li>
                  <li>If margin goes below the minimum, save will be blocked.</li>
                  <li>Setting stock to `0` will mark the product out of stock.</li>
                  <li>Uploading new photos replaces the existing gallery.</li>
                </ul>
              </section>
            </aside>
          </div>
        </form>
      </section>

      <section v-else class="panel">
        <h3>Products ({{ products.length }})</h3>
        <p v-if="loading" class="status">Loading...</p>
        <div v-else-if="products.length === 0" class="empty-products">
          <p class="empty-symbol" aria-hidden="true">[ ]</p>
          <p class="empty-title">No products yet</p>
          <p class="empty-note">Click + to add your first product.</p>
          <button type="button" class="secondary-btn" @click="goToAdd">Add Product</button>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Stock</th>
              <th>Slug</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in products" :key="item.id">
              <td>{{ item.title }}</td>
              <td>{{ item.category }}</td>
              <td>{{ formatPrice(item.final_price || item.price) }} (MRP {{ formatPrice(item.mrp || item.price) }})</td>
              <td>{{ Number(item.discount_percentage || item.discount || 0) }}%</td>
              <td>{{ item.is_out_of_stock ? `Out of stock (${item.stock_count || 0})` : `${item.stock_count || 0} left` }}</td>
              <td>{{ item.slug }}</td>
              <td>
                <button type="button" @click="goToEdit(item)">Edit</button>
                <button type="button" class="danger" @click="handleDelete(item)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AdminLoginPage from './components/AdminLoginPage.vue'
import PricingSettingsPanel from './components/PricingSettingsPanel.vue'
import {
  approveUpiPayment,
  calculatePricing,
  clearAdminSessionState,
  createProduct,
  deleteProduct,
  deleteContactMessage,
  deleteReview,
  fetchUsers,
  deleteUser,
  fetchAdminDashboard,
  fetchAdminProfile,
  fetchContactMessages,
  fetchOrderDetails,
  fetchOrders,
  fetchPricingSettings,
  fetchProducts,
  fetchReviews,
  loginAdmin,
  logoutAdmin,
  softDeleteOrder,
  updateOrderStatus,
  updatePricingSettings,
  updateProduct,
  uploadProductPhotos,
} from './api/products'

const products = ref([])
const orders = ref([])
const allOrders = ref([])
const reviews = ref([])
const contacts = ref([])
const users = ref([])
const selectedOrder = ref(null)
const loading = ref(false)
const authResolved = ref(false)
const authLoading = ref(false)
const authError = ref('')
const adminProfile = ref(null)
const adminDashboard = ref(null)
const error = ref('')
const success = ref('')
const routeHash = ref('')
const hydratedEditId = ref('')
const hydratedOrderId = ref('')

const form = ref({
  title: '',
  category: '',
  description: '',
  cost_price: 0,
  packaging_cost: 0,
  delivery_cost: 0,
  discount_percentage: 0,
  stock_count: 0,
  is_out_of_stock: false,
  description_points: [],
  photos: [],
})
const pricingSettings = ref({
  target_margin: 0.4,
  brand_multiplier: 1.1,
  gst_rate: 0.05,
  minimum_margin: 0.25,
  upi_id: '',
})
const preview = ref({})
const previewLoading = ref(false)
const selectedPhotoFiles = ref([])
const settingsLoading = ref(false)
const orderStatusForm = ref({
  status: 'pending',
  tracking_id: '',
  tracking_url: '',
  note: '',
})

const orderStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
const allowedTransitions = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'packed', 'cancelled'],
  packed: ['packed', 'shipped', 'cancelled'],
  shipped: ['shipped', 'out_for_delivery', 'cancelled'],
  out_for_delivery: ['out_for_delivery', 'delivered', 'cancelled'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
}

const baseCategoryOptions = ['Everyday', 'Occasion', 'Bridal', 'Gifting', 'General']

const isAuthenticated = computed(() => Boolean(adminProfile.value?.id))

const categoryOptions = computed(() => {
  if (form.value.category && !baseCategoryOptions.includes(form.value.category)) {
    return [form.value.category, ...baseCategoryOptions]
  }
  return baseCategoryOptions
})

const readRoute = () => {
  if (!window.location.hash && isAuthenticated.value) {
    window.location.hash = '/dashboard'
  }
  const value = window.location.hash || '#/dashboard'
  routeHash.value = value
}

const routePath = computed(() => {
  const withoutHash = routeHash.value.replace(/^#/, '')
  return withoutHash || '/dashboard'
})

const currentPage = computed(() => {
  if (routePath.value.startsWith('/dashboard')) return 'dashboard'
  if (routePath.value.startsWith('/contacts')) return 'contacts'
  if (routePath.value.startsWith('/users')) return 'users'
  if (routePath.value.startsWith('/payments')) return 'payments'
  if (routePath.value.startsWith('/settings')) return 'settings'
  if (routePath.value.startsWith('/reviews')) return 'reviews'
  if (routePath.value.startsWith('/orders/detail')) return 'order-detail'
  if (routePath.value.startsWith('/orders')) return 'order-list'
  if (routePath.value.startsWith('/products/edit')) return 'edit'
  if (routePath.value.startsWith('/products/new')) return 'new'
  return 'list'
})

const routeEditId = computed(() => {
  if (!routePath.value.includes('?')) return ''
  const query = routePath.value.split('?')[1] || ''
  return new URLSearchParams(query).get('id') || ''
})

const routeOrderId = computed(() => {
  if (!routePath.value.includes('?')) return ''
  const query = routePath.value.split('?')[1] || ''
  return new URLSearchParams(query).get('id') || ''
})

const pageTitle = computed(() => {
  if (currentPage.value === 'dashboard') return 'Dashboard'
  if (currentPage.value === 'contacts') return 'Contact Messages'
  if (currentPage.value === 'users') return 'User Management'
  if (currentPage.value === 'payments') return 'Payment Verification'
  if (currentPage.value === 'reviews') return 'Product Reviews'
  if (currentPage.value === 'order-detail') return 'Order Detail'
  if (currentPage.value === 'order-list') return 'Order Tracking'
  if (currentPage.value === 'edit') return 'Edit Product'
  if (currentPage.value === 'new') return 'Add Product'
  if (currentPage.value === 'settings') return 'Global Settings'
  return 'Product List'
})

const pendingOrders = computed(() =>
  orders.value.filter((order) => order.payment_status === 'verification_pending')
)

const availableStatusOptions = computed(() => {
  const currentStatus = selectedOrder.value?.status || 'pending'
  return allowedTransitions[currentStatus] || orderStatuses
})

const generatedSlug = computed(() =>
  form.value.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const loadAdminDashboardState = async () => {
  adminDashboard.value = await fetchAdminDashboard().catch(() => null)
}

const loadInitialData = async () => {
  await Promise.all([
    loadProducts(),
    loadAllOrders(),
    loadOrders(),
    loadContacts(),
    loadReviews(),
    loadUsers(),
    loadPricingSettings(),
    loadAdminDashboardState(),
  ])
}

const handleLogin = async (credentials) => {
  authLoading.value = true
  authError.value = ''
  try {
    const response = await loginAdmin(credentials)
    adminProfile.value = response.admin || null
    authResolved.value = true
    window.location.hash = '/dashboard'
    await loadInitialData()
  } catch (err) {
    authError.value = err.message || 'Login failed'
  } finally {
    authLoading.value = false
  }
}

const handleLogout = async () => {
  authLoading.value = true
  authError.value = ''
  try {
    await logoutAdmin()
  } catch {
    // Clear local state even if the server session is already gone.
  } finally {
    clearAdminSessionState()
    adminProfile.value = null
    adminDashboard.value = null
    authResolved.value = true
    authLoading.value = false
    window.location.hash = ''
  }
}

const initializeAuth = async () => {
  authLoading.value = true
  try {
    const response = await fetchAdminProfile()
    adminProfile.value = response.admin || null
    authResolved.value = true
    readRoute()
    await loadInitialData()
  } catch {
    clearAdminSessionState()
    adminProfile.value = null
    authResolved.value = true
  } finally {
    authLoading.value = false
  }
}

const resetForm = () => {
  form.value = {
    title: '',
    category: '',
    description: '',
    cost_price: 0,
    packaging_cost: 0,
    delivery_cost: 0,
    discount_percentage: 0,
    stock_count: 0,
    is_out_of_stock: false,
    description_points: [],
    photos: [],
  }
  preview.value = {}
  selectedPhotoFiles.value = []
}

const selectedPhotoNames = computed(() => selectedPhotoFiles.value.map((file) => file.name))

const marginStatus = computed(() => {
  const margin = Number(preview.value.margin_percentage || 0)
  if (!margin) return 'neutral'
  const minimum = Number(pricingSettings.value.minimum_margin || 0) * 100
  if (margin < minimum) return 'risky'
  if (margin < minimum + 10) return 'medium'
  return 'safe'
})

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const statusLabel = (value) => {
  const labels = {
    pending: 'Order Placed',
    confirmed: 'Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  }
  return labels[String(value || '')] || String(value || '')
}

const statusTone = (value) => {
  if (value === 'confirmed') return 'blue'
  if (value === 'shipped' || value === 'out_for_delivery') return 'orange'
  if (value === 'delivered') return 'green'
  if (value === 'cancelled') return 'red'
  return 'gray'
}

const loadProducts = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    products.value = await fetchProducts()
  } catch (err) {
    error.value = err.message || 'Failed to fetch products'
  } finally {
    loading.value = false
  }
}

const loadPricingSettings = async () => {
  if (!isAuthenticated.value) return
  settingsLoading.value = true
  try {
    pricingSettings.value = await fetchPricingSettings()
  } catch (err) {
    error.value = err.message || 'Failed to load pricing settings'
  } finally {
    settingsLoading.value = false
  }
}

const loadOrders = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    orders.value = await fetchOrders({ payment_status: 'verification_pending' })
  } catch (err) {
    error.value = err.message || 'Failed to load payments'
  } finally {
    loading.value = false
  }
}

const loadAllOrders = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    allOrders.value = await fetchOrders()
  } catch (err) {
    error.value = err.message || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

const loadContacts = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    contacts.value = await fetchContactMessages()
  } catch (err) {
    error.value = err.message || 'Failed to load contact messages'
  } finally {
    loading.value = false
  }
}

const loadReviews = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    reviews.value = await fetchReviews()
  } catch (err) {
    error.value = err.message || 'Failed to load reviews'
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  if (!isAuthenticated.value) return
  loading.value = true
  resetMessages()
  try {
    users.value = await fetchUsers()
  } catch (err) {
    error.value = err.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const handleDeleteReview = async (review) => {
  if (!review?.id) return
  const ok = window.confirm(`Delete review from ${review.name || 'this user'}?`)
  if (!ok) return

  loading.value = true
  resetMessages()
  try {
    await deleteReview(review.id)
    success.value = 'Review deleted.'
    await loadReviews()
  } catch (err) {
    error.value = err.message || 'Failed to delete review'
  } finally {
    loading.value = false
  }
}

const handleDeleteUser = async (user) => {
  if (!user?.email) return
  const ok = window.confirm(`Delete all reviews associated with ${user.email}?`)
  if (!ok) return

  loading.value = true
  resetMessages()
  try {
    await deleteUser(user.email)
    success.value = `User records removed for ${user.email}.`
    await loadUsers()
    await loadReviews()
  } catch (err) {
    error.value = err.message || 'Failed to delete user records'
  } finally {
    loading.value = false
  }
}

const handleDeleteContact = async (message) => {
  if (!message?.id) return
  const ok = window.confirm(`Delete message from ${message.name}?`)
  if (!ok) return

  loading.value = true
  resetMessages()
  try {
    await deleteContactMessage(message.id)
    success.value = 'Message deleted.'
    await loadContacts()
  } catch (err) {
    error.value = err.message || 'Failed to delete message'
  } finally {
    loading.value = false
  }
}

const loadOrderDetail = async () => {
  if (!isAuthenticated.value) return
  if (currentPage.value !== 'order-detail') return
  const id = routeOrderId.value
  if (!id || hydratedOrderId.value === id) return

  loading.value = true
  resetMessages()
  try {
    const order = await fetchOrderDetails(id)
    selectedOrder.value = order
    orderStatusForm.value = {
      status: order.status || 'pending',
      tracking_id: order.tracking_id || '',
      tracking_url: order.tracking_url || '',
      note: '',
    }
    hydratedOrderId.value = id
  } catch (err) {
    error.value = err.message || 'Failed to load order detail'
    selectedOrder.value = null
  } finally {
    loading.value = false
  }
}

const savePricingRules = async () => {
  loading.value = true
  resetMessages()
  try {
    pricingSettings.value = await updatePricingSettings({
      target_margin: Number(pricingSettings.value.target_margin || 0),
      brand_multiplier: Number(pricingSettings.value.brand_multiplier || 0),
      gst_rate: Number(pricingSettings.value.gst_rate || 0),
      minimum_margin: Number(pricingSettings.value.minimum_margin || 0),
      upi_id: String(pricingSettings.value.upi_id || '').trim(),
    })
    success.value = 'Pricing settings updated.'
    await updatePricePreview()
  } catch (err) {
    error.value = err.message || 'Failed to update pricing settings'
  } finally {
    loading.value = false
  }
}

const hydrateEditForm = () => {
  if (currentPage.value !== 'edit') return
  const id = routeEditId.value
  if (!id || hydratedEditId.value === id) return
  const item = products.value.find((product) => product.id === id)
  if (!item) return

  form.value = {
    title: item.title || '',
    category: item.category || '',
    description: item.description || '',
    cost_price: Number(item.cost_price || 0),
    packaging_cost: Number(item.packaging_cost || 0),
    delivery_cost: Number(item.delivery_cost || 0),
    discount_percentage: Number(item.discount_percentage || item.discount || 0),
    stock_count: Number(item.stock_count || 0),
    is_out_of_stock: Boolean(item.is_out_of_stock),
    description_points: Array.isArray(item.description_points) ? item.description_points.map((point, index) => ({
      order: Number(point.order ?? index),
      point: point.point || '',
    })) : [],
    photos: Array.isArray(item.photos) ? item.photos : [],
  }
  hydratedEditId.value = id
}

const addBullet = () => {
  form.value.description_points.push({
    order: form.value.description_points.length,
    point: '',
  })
}

const removeBullet = (index) => {
  form.value.description_points.splice(index, 1)
  form.value.description_points = form.value.description_points.map((bullet, order) => ({
    ...bullet,
    order,
  }))
}

const updatePricePreview = async () => {
  if (currentPage.value === 'list') {
    preview.value = {}
    return
  }

  const costPrice = Number(form.value.cost_price || 0)
  const packagingCost = Number(form.value.packaging_cost || 0)
  const deliveryCost = Number(form.value.delivery_cost || 0)
  const discountPercentage = Number(form.value.discount_percentage || 0)

  if (costPrice <= 0) {
    preview.value = {}
    return
  }

  previewLoading.value = true
  try {
    preview.value = await calculatePricing({
      cost_price: costPrice,
      packaging_cost: packagingCost,
      delivery_cost: deliveryCost,
      discount_percentage: discountPercentage,
      settings: {
        target_margin: Number(pricingSettings.value.target_margin || 0),
        brand_multiplier: Number(pricingSettings.value.brand_multiplier || 0),
        gst_rate: Number(pricingSettings.value.gst_rate || 0),
        minimum_margin: Number(pricingSettings.value.minimum_margin || 0),
      },
    })
  } catch (err) {
    preview.value = {}
    error.value = err.message || 'Failed to calculate pricing preview'
  } finally {
    previewLoading.value = false
  }
}

const handlePhotoSelection = (event) => {
  const files = event.target.files;

  selectedPhotoFiles.value = [];

  for (let i = 0; i < files.length && i < 10; i++) {
    selectedPhotoFiles.value.push(files[i]); // 🔥 direct File object
  }
};

const goToList = () => {
  window.location.hash = '/products'
}

const goToAdd = () => {
  window.location.hash = '/products/new'
}

const goToOrders = () => {
  hydratedOrderId.value = ''
  selectedOrder.value = null
  window.location.hash = '/orders'
}

const goToOrderDetail = (order) => {
  hydratedOrderId.value = ''
  selectedOrder.value = null
  window.location.hash = `/orders/detail?id=${encodeURIComponent(order.id)}`
}

const goToEdit = (item) => {
  hydratedEditId.value = ''
  window.location.hash = `/products/edit?id=${encodeURIComponent(item.id)}`
}

const saveOrderStatus = async () => {
  if (!selectedOrder.value) return
  loading.value = true
  resetMessages()
  try {
    const updated = await updateOrderStatus(selectedOrder.value.id, {
      status: orderStatusForm.value.status,
      tracking_id: orderStatusForm.value.tracking_id,
      tracking_url: orderStatusForm.value.tracking_url,
      note: orderStatusForm.value.note,
    })
    selectedOrder.value = updated
    orderStatusForm.value.note = ''
    success.value = `Order ${updated.order_ref} updated successfully.`
    hydratedOrderId.value = updated.id
    await loadAllOrders()
  } catch (err) {
    error.value = err.message || 'Failed to update order status'
  } finally {
    loading.value = false
  }
}

const handleSoftDeleteOrder = async (order) => {
  if (!order?.id) return
  const ok = window.confirm(`Soft delete order "${order.order_ref}"? It will be hidden from the order panel.`)
  if (!ok) return

  loading.value = true
  resetMessages()
  try {
    await softDeleteOrder(order.id)
    success.value = `Order ${order.order_ref} deleted.`
    const deletingSelected = selectedOrder.value?.id === order.id
    if (deletingSelected) {
      hydratedOrderId.value = ''
      selectedOrder.value = null
      goToOrders()
    }
    await Promise.all([loadAllOrders(), loadOrders()])
  } catch (err) {
    error.value = err.message || 'Failed to delete order'
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  loading.value = true
  resetMessages()

  try {
    if (selectedPhotoFiles.value.length > 10) {
      throw new Error('Maximum 10 photos are allowed')
    }

    let photos = form.value.photos
    if (selectedPhotoFiles.value.length) {
      photos = await uploadProductPhotos(selectedPhotoFiles.value)
    }

    const payload = {
      title: form.value.title,
      slug: generatedSlug.value || undefined,
      category: form.value.category,
      description: form.value.description,
      cost_price: Number(form.value.cost_price || 0),
      packaging_cost: Number(form.value.packaging_cost || 0),
      delivery_cost: Number(form.value.delivery_cost || 0),
      discount_percentage: Number(form.value.discount_percentage || 0),
      stock_count: Number(form.value.stock_count || 0),
      is_out_of_stock: Boolean(form.value.is_out_of_stock),
      description_points: form.value.description_points
        .map((bullet, index) => ({
          order: index,
          point: String(bullet.point || '').trim(),
        }))
        .filter((bullet) => bullet.point),
      photos,
      currency: 'INR',
    }

    if (currentPage.value === 'edit' && routeEditId.value) {
      await updateProduct(routeEditId.value, payload)
      success.value = 'Product updated successfully.'
    } else {
      await createProduct(payload)
      success.value = 'Product added successfully.'
    }

    resetForm()
    hydratedEditId.value = ''

    await loadProducts()
    goToList()
  } catch (err) {
    error.value = err.message || `Failed to ${currentPage.value === 'edit' ? 'update' : 'add'} product`
  } finally {
    loading.value = false
  }
}

const handleDelete = async (item) => {
  const ok = window.confirm(`Delete product "${item.title}"? This action cannot be undone.`)
  if (!ok) return

  loading.value = true
  resetMessages()

  try {
    await deleteProduct(item.id)
    success.value = 'Product deleted.'
    await loadProducts()
  } catch (err) {
    error.value = err.message || 'Failed to delete product'
  } finally {
    loading.value = false
  }
}

const approvePayment = async (order) => {
  const ok = window.confirm(`Approve UPI payment for order "${order.order_ref}"?`)
  if (!ok) return

  loading.value = true
  resetMessages()
  try {
    await approveUpiPayment(order.id)
    success.value = `Payment approved for ${order.order_ref}.`
    await Promise.all([loadOrders(), loadAllOrders(), loadProducts()])
  } catch (err) {
    error.value = err.message || 'Failed to approve payment'
  } finally {
    loading.value = false
  }
}

watch([currentPage, routeEditId, products], () => {
  if (!isAuthenticated.value) return
  if (currentPage.value === 'new') {
    hydratedEditId.value = ''
    resetForm()
  }
  hydrateEditForm()
})

watch(currentPage, (page) => {
  if (!isAuthenticated.value) return
  if (page === 'contacts') {
    loadContacts()
  }
  if (page === 'users') {
    loadUsers()
  }
  if (page === 'reviews') {
    loadReviews()
  }
  if (page === 'settings') {
    loadPricingSettings()
  }
}, { immediate: true })

watch([currentPage, routeOrderId], () => {
  if (!isAuthenticated.value) return
  if (currentPage.value !== 'order-detail') {
    hydratedOrderId.value = ''
    selectedOrder.value = null
    return
  }
  loadOrderDetail()
}, { immediate: true })

watch(
  () => form.value.stock_count,
  (value) => {
    form.value.is_out_of_stock = Number(value || 0) <= 0
  }
)

watch(
  () => form.value.is_out_of_stock,
  (value) => {
    if (value) {
      form.value.stock_count = 0
    }
  }
)

watch(
  () => [
    form.value.cost_price,
    form.value.packaging_cost,
    form.value.delivery_cost,
    form.value.discount_percentage,
    pricingSettings.value.target_margin,
    pricingSettings.value.brand_multiplier,
    pricingSettings.value.gst_rate,
    pricingSettings.value.minimum_margin,
  ],
  () => {
    updatePricePreview()
  },
  { immediate: true }
)

onMounted(() => {
  readRoute()
  window.addEventListener('hashchange', readRoute)
  initializeAuth()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', readRoute)
})
</script>
