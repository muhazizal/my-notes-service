require('dotenv').config()

const consola = require('consola')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const cors = require('cors')
const SequelizeStore = require('connect-session-sequelize')(expressSession.Store)

const sequelize = require('./config/database')

const noteRoutes = require('./routes/note')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')

// Init session store
const SessionStore = new SequelizeStore({
	db: sequelize,
})

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

// Use session store
app.use(
	expressSession({
		secret: process.env.SESSION_SECRET,
		store: SessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
		},
	})
)

// Routes
app.use('/api/notes', noteRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

// Start
sequelize
	.sync()
	.then(() => {
		app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
			consola.ready({
				message: `Server listening on port: ${process.env.APP_PORT}`,
				badge: true,
			})
		})
	})
	.catch((error) => {
		throw new Error(error)
	})
