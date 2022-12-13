import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongodb from 'mongodb'
import morgan from 'morgan'
import { createServer as createViteServer } from 'vite'

async function createServer() {
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
    // Catch all for 404
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

    // Instantiate db client
    const mongoClient = mongodb.MongoClient
    const mongoURI = process.env.MONGODB_URI

    // Configure port
    const port = process.env.PORT || 5173

    mongoClient
        .connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: mongodb.ServerApiVersion.v1,
        })
        .catch((err) => {
            console.error(err.stack)
            process.exit(1)
        })
        .then(async (client) => {
            app.listen(port, () => {
                console.log(`Listening on port ${port}`)
            })
        })
}

createServer()
