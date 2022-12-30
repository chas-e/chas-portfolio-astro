import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.MONGODB_URI
const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

export async function connectToDatabase() {
    try {
        // Connect to the MongoDB cluster
        await client.connect()
        // Make the appropriate DB calls
        await listDatabases(client)
    } catch (e) {
        console.error(e)
    } finally {
        await client.close()
    }
}

connectToDatabase().catch(console.error)

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases()
    console.log('Databases:')
    databasesList.databases.forEach((db) => console.log(` - ${db.name}`))
}
