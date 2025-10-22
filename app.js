require('dotenv').config()

const consola = require('consola')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const sequelize = require('./config/database')

const noteRoutes = require('./routes/note')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')

const app = express()

// Cors
app.use(
	cors({
		origin: true,
		credentials: true,
		methods: ['GET', 'PUT', 'POST', 'DELETE'],
		allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
	})
)

// Cookie Parser
app.use(cookieParser())

// Body Parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
app.use('/api/notes', noteRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

// Start
const startServer = () => {
	app.listen(process.env.PORT, process.env.HOST, () => {
		consola.ready({
			message: `Server listening on port: ${process.env.PORT}`,
			badge: true,
		})

		consola.ready({
			message: `NODE_ENV: ${process.env.NODE_ENV}`,
			badge: true,
		})
	})
}

if (process.env.NODE_ENV === 'development') {
	sequelize
		.sync()
		.then(startServer)
		.catch((error) => {
			throw new Error(error)
		})
} else {
	sequelize
		.authenticate()
		.then(startServer)
		.catch((error) => {
			throw new Error(error)
		})
}
