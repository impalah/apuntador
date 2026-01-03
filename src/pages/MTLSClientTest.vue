<template>
  <v-container fluid class="pa-4">
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" class="mr-2" @click="goBack" />
        [SECURE] mTLS Client Test
      </v-card-title>

      <v-card-text>
        <v-alert v-if="!isAndroid" type="warning" class="mb-4">
          mTLS is only available on Android (physical devices with HSM)
        </v-alert>

        <!-- mTLS Status -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1"> [STATS] mTLS Client Status </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-chip :color="clientStatus.isReady ? 'success' : 'error'" label class="mb-2">
                  {{ clientStatus.isReady ? '[OK] Ready' : '[ERROR] Not Ready' }}
                </v-chip>
              </v-col>

              <v-col v-if="clientStatus.certificateInfo" cols="12">
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title>Subject:</v-list-item-title>
                    <v-list-item-subtitle>{{
                      clientStatus.certificateInfo.subject
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Expires:</v-list-item-title>
                    <v-list-item-subtitle>{{
                      clientStatus.certificateInfo.notAfter
                    }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Serial:</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ clientStatus.certificateInfo.serial }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-btn color="primary" variant="outlined" block class="mt-2" @click="checkStatus">
              [REFRESH] Refresh Status
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Test Endpoint -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1"> [EXPERIMENT] Test mTLS Request </v-card-title>
          <v-card-text>
            <!-- Quick Test Buttons -->
            <div class="mb-3">
              <v-chip-group>
                <v-chip
                  size="small"
                  color="success"
                  variant="outlined"
                  @click="
                    testUrl = 'https://apuntador.ngrok.app/health/public';
                    testMethod = 'GET';
                  "
                >
                  Public Health (No mTLS)
                </v-chip>
                <v-chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  @click="
                    testUrl = 'https://apuntador.ngrok.app/health';
                    testMethod = 'GET';
                  "
                >
                  Protected Health (mTLS)
                </v-chip>
              </v-chip-group>
            </div>

            <v-text-field
              v-model="testUrl"
              label="Backend URL"
              placeholder="https://apuntador.ngrok.app/test"
              density="compact"
              class="mb-2"
            />

            <v-select
              v-model="testMethod"
              :items="['GET', 'POST', 'PUT', 'DELETE']"
              label="Method"
              density="compact"
              class="mb-2"
            />

            <v-textarea
              v-if="testMethod === 'POST' || testMethod === 'PUT'"
              v-model="testBody"
              label="Request Body (JSON)"
              rows="3"
              density="compact"
              class="mb-2"
            />

            <v-btn
              :loading="testing"
              :disabled="!clientStatus.isReady"
              color="primary"
              block
              @click="testRequest"
            >
              [LAUNCH] Send Request
            </v-btn>

            <v-card v-if="testResponse" variant="tonal" class="mt-4">
              <v-card-title class="text-subtitle-2"> Response: </v-card-title>
              <v-card-text>
                <pre class="text-caption">{{ testResponse }}</pre>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <!-- Renewal Service -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            [RECYCLE] Certificate Renewal Service
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="renewalBackendUrl"
              label="Backend URL"
              placeholder="https://apuntador.ngrok.app"
              density="compact"
              class="mb-2"
            />

            <v-row dense>
              <v-col cols="6">
                <v-btn
                  :disabled="renewalServiceRunning"
                  color="success"
                  block
                  variant="outlined"
                  @click="startRenewalService"
                >
                  [PLAY] Start Service
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  :disabled="!renewalServiceRunning"
                  color="error"
                  block
                  variant="outlined"
                  @click="stopRenewalService"
                >
                  [STOP] Stop Service
                </v-btn>
              </v-col>
            </v-row>

            <v-alert v-if="renewalServiceRunning" type="info" density="compact" class="mt-2">
              Service checks certificate every 24 hours and renews if &lt; 5 days remaining
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Logs -->
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            [NOTE] Logs
            <v-spacer />
            <v-btn size="small" variant="text" icon="mdi-delete" @click="clearLogs" />
          </v-card-title>
          <v-card-text>
            <div
              class="logs-container"
              style="max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px"
            >
              <div
                v-for="(log, index) in logs"
                :key="index"
                :class="`log-${log.level}`"
                style="margin-bottom: 4px"
              >
                {{ '[' + log.timestamp + '] ' + log.level.toUpperCase() + ': ' + log.message }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import MTLSClient from '@/plugins/mtlsClient'

const router = useRouter()

interface Log {
  level: 'info' | 'success' | 'error'
  message: string
  timestamp: string
}

const isAndroid = Capacitor.getPlatform() === 'android'

// Navigation
function goBack() {
  router.push('/')
}

const clientStatus = ref<{
  isReady: boolean
  certificateInfo?: {
    subject: string
    issuer: string
    serial: string
    notBefore: string
    notAfter: string
  }
}>({
  isReady: false,
})

const testUrl = ref('https://apuntador.ngrok.app/health/public')
const testMethod = ref('GET')
const testBody = ref('{\n  "test": "data"\n}')
const testing = ref(false)
const testResponse = ref<string | null>(null)

const renewalBackendUrl = ref('https://apuntador.ngrok.app')
const renewalServiceRunning = ref(false)

const logs = ref<Log[]>([])

function addLog(level: 'info' | 'success' | 'error', message: string) {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ level, message, timestamp })
  console.log(`[${level.toUpperCase()}]`, message)
}

function clearLogs() {
  logs.value = []
}

async function checkStatus() {
  try {
    addLog('info', 'Checking mTLS client status...')
    const result = await MTLSClient.isReady()
    clientStatus.value = result

    if (result.isReady) {
      addLog('success', 'mTLS client is ready!')
    } else {
      addLog('error', 'mTLS client not ready - device needs enrollment')
    }
  } catch (error: any) {
    addLog('error', `Failed to check status: ${error.message}`)
  }
}

async function testRequest() {
  testing.value = true
  testResponse.value = null

  try {
    addLog('info', `Sending ${testMethod.value} request to ${testUrl.value}`)

    let result: { data: string; statusCode: number }

    switch (testMethod.value) {
      case 'GET':
        result = await MTLSClient.get({ url: testUrl.value })
        break
      case 'POST':
        result = await MTLSClient.post({
          url: testUrl.value,
          body: testBody.value,
        })
        break
      case 'PUT':
        result = await MTLSClient.put({
          url: testUrl.value,
          body: testBody.value,
        })
        break
      case 'DELETE':
        result = await MTLSClient.delete({ url: testUrl.value })
        break
      default:
        throw new Error('Invalid method')
    }

    testResponse.value = result.data
    addLog('success', `Request successful (${result.statusCode})`)
  } catch (error: any) {
    addLog('error', `Request failed: ${error.message}`)
    testResponse.value = `Error: ${error.message}`
  } finally {
    testing.value = false
  }
}

async function startRenewalService() {
  try {
    addLog('info', `Starting renewal service with backend: ${renewalBackendUrl.value}`)
    await MTLSClient.startRenewalService({ backendUrl: renewalBackendUrl.value })
    renewalServiceRunning.value = true
    addLog('success', 'Renewal service started')
  } catch (error: any) {
    addLog('error', `Failed to start service: ${error.message}`)
  }
}

async function stopRenewalService() {
  try {
    addLog('info', 'Stopping renewal service...')
    await MTLSClient.stopRenewalService()
    renewalServiceRunning.value = false
    addLog('success', 'Renewal service stopped')
  } catch (error: any) {
    addLog('error', `Failed to stop service: ${error.message}`)
  }
}

onMounted(() => {
  addLog('info', 'mTLS Client Test Page loaded')
  addLog('info', `Platform: ${Capacitor.getPlatform()}`)

  if (isAndroid) {
    checkStatus()
  }
})
</script>

<style scoped>
.log-info {
  color: #2196f3;
}

.log-success {
  color: #4caf50;
}

.log-error {
  color: #f44336;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
