import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


// https://vite.dev/config/

export default defineConfig({

  plugins: [react()],

  server: {

    allowedHosts: [

      'a-ta-01m3kta5qnr0chmxjtx0wa6s1s-f7xfemend0s923jfo73u66bjb.w.modal.host'

    ]

}
})
