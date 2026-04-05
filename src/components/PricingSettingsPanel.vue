<template>
  <section class="panel form-panel">
    <div class="section-heading">
      <h3>Global Pricing Settings</h3>
      <p>Update pricing rules and UPI details outside individual product pages.</p>
    </div>

    <form class="settings-form" @submit.prevent="handleSave">
      <div class="field-grid settings-grid">
        <label>
          Target Margin
          <input v-model.number="localSettings.target_margin" type="number" min="0" max="0.99" step="0.01" />
        </label>
        <label>
          Brand Multiplier
          <input v-model.number="localSettings.brand_multiplier" type="number" min="0.01" step="0.01" />
        </label>
        <label>
          GST Rate
          <input v-model.number="localSettings.gst_rate" type="number" min="0" max="1" step="0.01" />
        </label>
        <label>
          Minimum Margin
          <input v-model.number="localSettings.minimum_margin" type="number" min="0" max="0.99" step="0.01" />
        </label>
        <label>
          UPI ID
          <input v-model.trim="localSettings.upi_id" type="text" placeholder="your@bank" />
        </label>
      </div>

      <div class="form-actions stacked-actions">
        <button type="submit" :disabled="settingsLoading">{{ settingsLoading ? 'Saving...' : 'Save Settings' }}</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { watch, reactive } from 'vue'

const props = defineProps({
  settings: {
    type: Object,
    required: true,
  },
  settingsLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save'])

const localSettings = reactive({
  target_margin: 0,
  brand_multiplier: 0,
  gst_rate: 0,
  minimum_margin: 0,
  upi_id: '',
})

const syncSettings = (source) => {
  localSettings.target_margin = Number(source.target_margin || 0)
  localSettings.brand_multiplier = Number(source.brand_multiplier || 0)
  localSettings.gst_rate = Number(source.gst_rate || 0)
  localSettings.minimum_margin = Number(source.minimum_margin || 0)
  localSettings.upi_id = String(source.upi_id || '').trim()
}

watch(
  () => props.settings,
  (value) => {
    if (value) syncSettings(value)
  },
  { immediate: true, deep: true }
)

const handleSave = () => {
  emit('save', {
    target_margin: Number(localSettings.target_margin || 0),
    brand_multiplier: Number(localSettings.brand_multiplier || 0),
    gst_rate: Number(localSettings.gst_rate || 0),
    minimum_margin: Number(localSettings.minimum_margin || 0),
    upi_id: String(localSettings.upi_id || '').trim(),
  })
}
</script>
