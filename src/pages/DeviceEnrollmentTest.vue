<template>
  <v-container>
    <v-card class="mx-auto" max-width="800">
      <v-card-title class="text-h5 d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-2"></v-btn>
        Device Enrollment Test (mTLS + HSM)
      </v-card-title>

      <v-card-text>
        <!-- Device Info Section -->
        <v-card class="mb-4" variant="tonal" color="primary">
          <v-card-title>Device Information</v-card-title>
          <v-card-text>
            <div v-if="deviceInfo">
              <div class="mb-2"><strong>Device ID:</strong> {{ deviceInfo.deviceId }}</div>
              <div class="mb-2"><strong>Manufacturer:</strong> {{ deviceInfo.manufacturer }}</div>
              <div class="mb-2"><strong>Model:</strong> {{ deviceInfo.model }}</div>
              <div class="mb-2">
                <strong>Android Version:</strong> {{ deviceInfo.androidVersion }}
              </div>
              <div class="mb-2"><strong>API Level:</strong> {{ deviceInfo.apiLevel }}</div>
              <v-chip
                :color="deviceInfo.hasStrongBox ? 'success' : 'warning'"
                size="small"
                class="mr-2"
              >
                StrongBox: {{ deviceInfo.hasStrongBox ? '✓' : '✗' }}
              </v-chip>
              <v-chip :color="deviceInfo.hasTEE ? 'success' : 'warning'" size="small">
                TEE: {{ deviceInfo.hasTEE ? '✓' : '✗' }}
              </v-chip>
            </div>
            <v-btn
              v-else
              @click="loadDeviceInfo"
              :loading="loadingDeviceInfo"
              color="primary"
              block
            >
              Load Device Info
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Enrollment Status Section -->
        <v-card class="mb-4" variant="tonal" :color="enrollmentStatusColor">
          <v-card-title>Enrollment Status</v-card-title>
          <v-card-text>
            <div v-if="enrollmentStatus">
              <div class="mb-2">
                <strong>Enrolled:</strong>
                <v-chip :color="enrollmentStatus.isEnrolled ? 'success' : 'error'" size="small">
                  {{ enrollmentStatus.isEnrolled ? 'YES' : 'NO' }}
                </v-chip>
              </div>
              <div v-if="enrollmentStatus.isEnrolled">
                <div class="mb-2">
                  <strong>Certificate Serial:</strong> {{ enrollmentStatus.certificateSerial }}
                </div>
                <div class="mb-2">
                  <strong>Certificate Subject:</strong> {{ enrollmentStatus.certificateSubject }}
                </div>
                <div class="mb-2">
                  <strong>Expires At:</strong> {{ enrollmentStatus.certificateExpiry }}
                </div>
                <div class="mb-2">
                  <strong>Days Remaining:</strong>
                  <v-chip
                    :color="enrollmentStatus.daysRemaining > 5 ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ enrollmentStatus.daysRemaining }} days
                  </v-chip>
                </div>
                <div class="mb-2">
                  <strong>Needs Renewal:</strong>
                  <v-chip
                    :color="enrollmentStatus.needsRenewal ? 'warning' : 'success'"
                    size="small"
                  >
                    {{ enrollmentStatus.needsRenewal ? 'YES' : 'NO' }}
                  </v-chip>
                </div>
              </div>
            </div>
            <v-btn
              v-else
              @click="checkEnrollmentStatus"
              :loading="checkingStatus"
              color="primary"
              block
            >
              Check Enrollment Status
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Backend Configuration -->
        <v-text-field
          v-model="backendUrl"
          label="Backend URL"
          hint="URL del backend (ej: https://apuntador.ngrok.app)"
          persistent-hint
          class="mb-4"
        ></v-text-field>

        <!-- Actions -->
        <v-row>
          <v-col cols="6">
            <v-btn
              @click="enrollDevice"
              :loading="enrolling"
              :disabled="!backendUrl"
              color="success"
              block
              size="large"
            >
              <v-icon start>mdi-shield-check</v-icon>
              Enroll Device
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              @click="unenrollDevice"
              :loading="unenrolling"
              :disabled="!enrollmentStatus?.isEnrolled"
              color="error"
              block
              size="large"
            >
              <v-icon start>mdi-shield-remove</v-icon>
              Unenroll
            </v-btn>
          </v-col>
        </v-row>

        <!-- Logs Section -->
        <v-card class="mt-4" variant="tonal">
          <v-card-title>
            Logs
            <v-spacer></v-spacer>
            <v-btn @click="logs = []" size="small" variant="text" icon="mdi-delete"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="logs.length === 0" class="text-center text-grey">No logs yet</div>
            <div v-else style="max-height: 300px; overflow-y: auto">
              <div
                v-for="(log, index) in logs"
                :key="index"
                :class="['log-entry', `log-${log.type}`]"
                class="mb-2 pa-2 rounded"
              >
                <div class="text-caption text-grey">{{ log.timestamp }}</div>
                <div>{{ log.message }}</div>
                <pre v-if="log.data" class="text-caption mt-1">{{
                  JSON.stringify(log.data, null, 2)
                }}</pre>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { unifiedMTLSService } from '@/services/unifiedMTLSService'

const router = useRouter()

// State
const deviceInfo = ref<any>(null)
const enrollmentStatus = ref<any>(null)
const backendUrl = ref('https://apuntador.ngrok.app')
const logs = ref<Array<{ type: string; message: string; timestamp: string; data?: any }>>([])

// Loading states
const loadingDeviceInfo = ref(false)
const checkingStatus = ref(false)
const enrolling = ref(false)
const unenrolling = ref(false)

// Computed
const enrollmentStatusColor = computed(() => {
  if (!enrollmentStatus.value) return 'grey'
  if (!enrollmentStatus.value.isEnrolled) return 'error'
  if (enrollmentStatus.value.needsRenewal) return 'warning'
  return 'success'
})

// Navigation
function goBack() {
  router.push('/')
}

// Methods
function addLog(type: 'info' | 'success' | 'error' | 'warning', message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift({ type, message, timestamp, data })
  console.log(`[${type.toUpperCase()}] ${message}`, data)
}

async function loadDeviceInfo() {
  if (!Capacitor.isNativePlatform()) {
    addLog('error', 'Device enrollment only available on native platforms')
    return
  }

  loadingDeviceInfo.value = true
  try {
    addLog('info', 'Loading device information...')
    const status = await unifiedMTLSService.checkEnrollmentStatus()
    deviceInfo.value = {
      platform: status.platform,
      deviceId: status.deviceId,
      model: status.deviceModel,
      version: status.osVersion,
      hasHSM: status.hasHSM,
      hsmType: status.hsmType,
    }
    addLog('success', 'Device info loaded successfully', deviceInfo.value)
  } catch (error: any) {
    addLog('error', `Failed to load device info: ${error.message}`, error)
  } finally {
    loadingDeviceInfo.value = false
  }
}

async function checkEnrollmentStatus() {
  if (!Capacitor.isNativePlatform()) {
    addLog('error', 'Device enrollment only available on native platforms')
    return
  }

  checkingStatus.value = true
  try {
    addLog('info', 'Checking enrollment status...')
    const status = await unifiedMTLSService.checkEnrollmentStatus()
    enrollmentStatus.value = {
      isEnrolled: status.enrolled,
      platform: status.platform,
      deviceId: status.deviceId,
      hsmType: status.hsmType,
    }
    addLog('success', 'Enrollment status loaded', enrollmentStatus.value)
  } catch (error: any) {
    addLog('error', `Failed to check enrollment status: ${error.message}`, error)
  } finally {
    checkingStatus.value = false
  }
}

async function enrollDevice() {
  if (!Capacitor.isNativePlatform()) {
    addLog('error', 'Device enrollment only available on native platforms')
    return
  }

  if (!backendUrl.value) {
    addLog('error', 'Backend URL is required')
    return
  }

  enrolling.value = true
  try {
    addLog('info', `Starting enrollment with backend: ${backendUrl.value}`)
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      addLog('info', 'Step 1/5: Generating key pair in HSM (StrongBox/TEE)...')
    } else if (platform === 'ios') {
      addLog('info', 'Step 1/5: Generating key pair in Secure Enclave...')
    }

    const result = await unifiedMTLSService.ensureEnrolled()

    if (result.success) {
      addLog('success', 'Device enrolled successfully!', result)

      if (result.alreadyEnrolled) {
        addLog('info', `Device was already enrolled`)
      } else {
        addLog('info', `New certificate issued for device: ${result.deviceId}`)
        if (result.certificateSize) {
          addLog('info', `Certificate size: ${result.certificateSize} bytes`)
        }
      }

      // Reload status
      await checkEnrollmentStatus()
    } else {
      addLog('error', `Enrollment failed: ${result.error}`)
    }
  } catch (error: any) {
    addLog('error', `Enrollment failed: ${error.message}`, error)
  } finally {
    enrolling.value = false
  }
}

async function unenrollDevice() {
  if (!Capacitor.isNativePlatform()) {
    addLog('error', 'Device enrollment only available on native platforms')
    return
  }

  unenrolling.value = true
  try {
    addLog('info', 'Unenrolling device...')
    await unifiedMTLSService.deleteAllCredentials()
    addLog('success', 'Device unenrolled successfully')

    // Clear status
    enrollmentStatus.value = null
    await checkEnrollmentStatus()
  } catch (error: any) {
    addLog('error', `Unenroll failed: ${error.message}`, error)
  } finally {
    unenrolling.value = false
  }
}

// Lifecycle
onMounted(async () => {
  addLog('info', 'Device Enrollment Test Page loaded')

  if (Capacitor.isNativePlatform()) {
    addLog('info', `Platform: ${Capacitor.getPlatform()}`)
    await loadDeviceInfo()
    await checkEnrollmentStatus()
  } else {
    addLog('warning', 'Running on web platform - mTLS features not available')
  }
})
</script>

<style scoped>
.log-entry {
  font-family: monospace;
  font-size: 0.875rem;
}

.log-info {
  background-color: rgba(33, 150, 243, 0.1);
  border-left: 3px solid #2196f3;
}

.log-success {
  background-color: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
}

.log-error {
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
}

.log-warning {
  background-color: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
}
</style>
