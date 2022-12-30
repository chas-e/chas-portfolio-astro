import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import { createServer as createViteServer } from 'vite'
import { connectToDatabase } from './mongodb/connect.mjs'

async function createServer() {
    // Set PORT
    const PORT = process.env.PORT || 3001

    // Instantiate App
    const app = express()

    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
    })

    // Configure app
    dotenv.config()

    // Mount/configure middleware
    app.use(cors())
    app.use(morgan('dev'))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(vite.middlewares)

    // Mount api, routes
    // Placeholder for home page
    app.get('/', (req, res) => {
        res.send('This is a home page!')
    })

    app.use('*', async (req, res, next) => {
        const url = req.originalUrl
        try {
            // Read index.html
            let template = fs.readFileSync(
                path.resolve(__dirname, 'index.html'),
                'utf-8'
            )

            // Apply vite html transforms
            template = await vite.transformIndexHtml(url, template)

            // Load server entry
            const { render } = await vite.ssrLoadModule('/src/index.server.mjs')

            // Render app html (call appropriate framework SSR apis in index.server.mjs exported render function)
            const appHtml = await render(url)

            // Inject server-rendered html into template
            const html = template.replace(`<!--ssr-outlet-->`, appHtml)

            // Send rendered html back to client
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
            // Catch/handle errors
        } catch (e) {
            vite.ssrFixStacktrace(e)
            console.error(e)
            next(e)
        }
    })

    // Connect to database
    connectToDatabase()

    // Start Express server
    app.listen(PORT, () => {
        console.log(`Server running on port: ${PORT}`)
    })
}

createServer()
