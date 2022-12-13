import { defineConfig } from 'astro/config'

// https://astro.build/config
import svelte from '@astrojs/svelte'

// https://astro.build/config
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
    output: 'server',
    srcDir: './src',
    publicDir: './public',
    site: 'https://chasengineering.dev',
    integrations: [svelte()],
    adapter: node({
        // mode: 'middleware',
    }),
})
