<template>
  <v-card class="ma-4 pa-4">
    <v-card-title class="text-h5">
      [SECURE] Desktop mTLS Enrollment Test
    </v-card-title>

    <v-card-text>
      <v-alert
        v-if="platform !== 'desktop'"
        type="info"
        class="mb-4"
      >
        [INFO] This test is only for Desktop (Tauri). Current platform: {{ platform }}
      </v-alert>

      <v-row v-if="deviceInfo">
        <v-col cols="12">
          <v-list>
            <v-list-item>
              <v-list-item-title>Device ID</v-list-item-title>
              <v-list-item-subtitle>{{ deviceInfo.device_id }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Platform</v-list-item-title>
              <v-list-item-subtitle>{{ deviceInfo.platform }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Device Model</v-list-item-title>
              <v-list-item-subtitle>{{ deviceInfo.device_model }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>OS Version</v-list-item-title>
              <v-list-item-subtitle>{{ deviceInfo.os_version }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Has Certificate</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="deviceInfo.has_certificate ? 'success' : 'error'">
                  {{ deviceInfo.has_certificate ? 'Yes' : 'No' }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <v-row v-if="enrollmentStatus">
        <v-col cols="12">
          <v-alert :type="enrollmentStatus.enrolled ? 'success' : 'info'" class="mb-4">
            <div class="text-h6 mb-2">
              {{ enrollmentStatus.enrolled ? '[OK] Enrolled' : '[INFO] Not Enrolled' }}
            </div>
            <div v-if="enrollmentStatus.enrolled">
              <div>Device ID: {{ enrollmentStatus.device_id }}</div>
              <div v-if="enrollmentStatus.certificate_expires_at">
                Expires: {{ new Date(enrollmentStatus.certificate_expires_at).toLocaleString() }}
              </div>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-if="error">
        <v-col cols="12">
          <v-alert type="error">
            {{ error }}
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-if="log.length > 0">
        <v-col cols="12">
          <v-card variant="tonal">
            <v-card-title>Console Log</v-card-title>
            <v-card-text>
              <v-list density="compact" class="log-list">
                <v-list-item
                  v-for="(entry, index) in log"
                  :key="index"
                  class="log-entry"
                >
                  <v-list-item-title class="font-monospace text-caption">
                    {{ entry }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="primary"
        :loading="loading"
        @click="getDeviceInfo"
      >
        Get Device Info
      </v-btn>
      <v-btn
        color="info"
        :loading="loading"
        @click="checkStatus"
      >
        Check Status
      </v-btn>
      <v-btn
        color="success"
        :loading="loading"
        @click="enroll"
      >
        Enroll Device
      </v-btn>
      <v-btn
        color="error"
        :loading="loading"
        @click="unenroll"
      >
        Unenroll
      </v-btn>
      <v-spacer />
      <v-btn
        variant="text"
        @click="clearLog"
      >
        Clear Log
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { unifiedMTLSService } from '@/services/unifiedMTLSService'
import { desktopEnrollmentService } from '@/services/desktopEnrollmentService'
import type { DesktopDeviceInfo, DesktopEnrollmentResult } from '@/services/desktopEnrollmentService'

const platform = ref(unifiedMTLSService.getPlatform())
const deviceInfo = ref<DesktopDeviceInfo | null>(null)
const enrollmentStatus = ref<DesktopEnrollmentResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const log = ref<string[]>([])

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  log.value.push(`[${timestamp}] ${message}`)
  console.log(message)
}

function clearLog() {
  log.value = []
}

async function getDeviceInfo() {
  loading.value = true
  error.value = null
  
  try {
    addLog('[SEARCH] Getting device information...')
    deviceInfo.value = await desktopEnrollmentService.getDeviceInfo()
    addLog(`[OK] Device info: ${deviceInfo.value.device_id}`)
  } catch (err) {
    error.value = `Failed to get device info: ${err}`
    addLog(`[ERROR] Error: ${err}`)
  } finally {
    loading.value = false
  }
}

async function checkStatus() {
  loading.value = true
  error.value = null
  
  try {
    addLog('[SEARCH] Checking enrollment status...')
    enrollmentStatus.value = await desktopEnrollmentService.checkEnrollmentStatus()
    addLog(`[OK] Status: ${enrollmentStatus.value.enrolled ? 'Enrolled' : 'Not enrolled'}`)
  } catch (err) {
    error.value = `Failed to check status: ${err}`
    addLog(`[ERROR] Error: ${err}`)
  } finally {
    loading.value = false
  }
}

async function enroll() {
  loading.value = true
  error.value = null
  
  try {
    addLog('[LAUNCH] Starting enrollment...')
    const result = await desktopEnrollmentService.enrollDevice()
    
    if (result.success) {
      addLog(`[OK] Enrollment successful! Device ID: ${result.device_id}`)
      enrollmentStatus.value = result
      await getDeviceInfo()
    } else {
      error.value = result.error || 'Enrollment failed'
      addLog(`[ERROR] Enrollment failed: ${error.value}`)
    }
  } catch (err) {
    error.value = `Enrollment error: ${err}`
    addLog(`[ERROR] Error: ${err}`)
  } finally {
    loading.value = false
  }
}

async function unenroll() {
  loading.value = true
  error.value = null
  
  try {
    addLog('[DELETE]  Unenrolling device...')
    await desktopEnrollmentService.unenrollDevice()
    addLog('[OK] Device unenrolled successfully')
    enrollmentStatus.value = null
    await getDeviceInfo()
  } catch (err) {
    error.value = `Failed to unenroll: ${err}`
    addLog(`[ERROR] Error: ${err}`)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (platform.value === 'desktop') {
    await getDeviceInfo()
    await checkStatus()
  }
})
</script>

<style scoped>
.log-list {
  max-height: 400px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  color: #d4d4d4;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.font-monospace {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace !important;
}
</style>
