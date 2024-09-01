import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Importa FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons';


import { VueShowdownPlugin, showdown } from 'vue-showdown';


// Añade todos los iconos sólidos a la biblioteca
library.add(fas)
library.add(fab)

const app = createApp(App)

app.use(VueShowdownPlugin, {
    // set default flavor of showdown
    flavor: 'github',
    // set default options of showdown (will override the flavor options)
    options: {
      emoji: true,
    },
});

app.use(createPinia())
app.use(router)

// Registra el componente FontAwesomeIcon globalmente
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
