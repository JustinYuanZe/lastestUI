import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const DB_PATH = join(import.meta.dir, 'db.json')
const SALT_ROUNDS = 10

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key-change-in-production'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key-change-in-production'

async function getDB() {
  const data = await readFile(DB_PATH, 'utf-8')
  return JSON.parse(data)
}

async function saveDB(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2))
}

const app = new Elysia()
  .use(cors())
  .use(
    jwt({
      name: 'jwt',
      secret: ACCESS_TOKEN_SECRET
    })
  )
  .use(
    jwt({
      name: 'refreshJwt',
      secret: REFRESH_TOKEN_SECRET
    })
  )
  .post('/register', async ({ body, set, jwt, refreshJwt }) => {
    // Accept extended profile fields. Many are optional; require basic auth fields.
    const {
      username,
      password,
      department,

      // profile fields (optional)
      identity,
      gender,
      accountNumber,
      name,
      dateOfBirth,
      email,
      mobilePhone,
      enrollmentYear,
      enrollmentLevel,
      schoolCity,
      schoolName,
      durationOfStudy,
      departmentInstitute,
      yearClass,
      studentId,
      agreedToTerms
    } = body

    // Server-side validation
    if (!username || !password || !department) {
      set.status = 400
      return { success: false, message: 'Missing required fields: username, password and department' }
    }

    // Validate username length and format
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      set.status = 400
      return { success: false, message: 'Username must be between 3 and 50 characters' }
    }

    // Validate password strength
    if (typeof password !== 'string' || password.length < 6) {
      set.status = 400
      return { success: false, message: 'Password must be at least 6 characters long' }
    }

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      set.status = 400
      return { success: false, message: 'Invalid email format' }
    }

    // Validate identity field
    const validIdentities = ['student', 'Unemployed', 'employed']
    if (identity && !validIdentities.includes(identity)) {
      set.status = 400
      return { success: false, message: 'Invalid identity value' }
    }

    // Validate gender field
    const validGenders = ['female', 'male']
    if (gender && !validGenders.includes(gender)) {
      set.status = 400
      return { success: false, message: 'Invalid gender value' }
    }

    // Validate dateOfBirth structure if provided
    if (dateOfBirth && typeof dateOfBirth === 'object') {
      const { year, month, day } = dateOfBirth
      if (year && (year < 1900 || year > new Date().getFullYear())) {
        set.status = 400
        return { success: false, message: 'Invalid birth year' }
      }
      if (month && (month < 1 || month > 12)) {
        set.status = 400
        return { success: false, message: 'Invalid birth month' }
      }
      if (day && (day < 1 || day > 31)) {
        set.status = 400
        return { success: false, message: 'Invalid birth day' }
      }
    }

    const db = await getDB()
    const existingUser = db.users.find(u => u.username === username)
    if (existingUser) {
      set.status = 400
      return { success: false, message: 'Username already exists' }
    }

    // Hash password before storing
    console.log('Hashing password with bcryptjs...')
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    console.log('Password hashed successfully')

    const user = {
      id: Date.now(),
      username,
      password: hashedPassword,
      department,
      profile: {
        identity: identity || null,
        gender: gender || null,
        accountNumber: accountNumber || null,
        name: name || null,
        // dateOfBirth can be an ISO string or an object { year, month, day }
        dateOfBirth: dateOfBirth || null,
        email: email || null,
        mobilePhone: mobilePhone || null,
        enrollment: {
          year: enrollmentYear || null,
          level: enrollmentLevel || null
        },
        school: {
          city: schoolCity || null,
          name: schoolName || null
        },
        durationOfStudy: durationOfStudy || null,
        departmentInstitute: departmentInstitute || null,
        yearClass: yearClass || null,
        studentId: studentId || null,
        agreedToTerms: !!agreedToTerms
      }
    }

    db.users.push(user)
    console.log('Saving user with profile:', JSON.stringify(user.profile, null, 2))

    // Generate tokens
    const accessToken = await jwt.sign({
      userId: user.id,
      username: user.username,
      type: 'access'
    })

    const refreshToken = await refreshJwt.sign({
      userId: user.id,
      username: user.username,
      type: 'refresh'
    })

    // Store refresh token
    if (!db.refreshTokens) db.refreshTokens = []
    db.refreshTokens.push({
      userId: user.id,
      token: refreshToken,
      createdAt: new Date().toISOString()
    })
    
    // Save database once after all operations
    await saveDB(db)

    return {
      success: true,
      user: { id: user.id, username: user.username, department: user.department, profile: user.profile },
      accessToken,
      refreshToken
    }
  })
  .post('/login', async ({ body, set, jwt, refreshJwt }) => {
    const { username, password } = body
    
    if (!username || !password) {
      set.status = 400
      return { success: false, message: 'Username and password are required' }
    }

    const db = await getDB()
    const user = db.users.find(u => u.username === username)

    if (!user) {
      set.status = 401
      return { success: false, message: 'Invalid credentials' }
    }

    // Verify password hash
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      set.status = 401
      return { success: false, message: 'Invalid credentials' }
    }

    // Generate tokens
    const accessToken = await jwt.sign({
      userId: user.id,
      username: user.username,
      type: 'access'
    })

    const refreshToken = await refreshJwt.sign({
      userId: user.id,
      username: user.username,
      type: 'refresh'
    })

    // Store refresh token
    if (!db.refreshTokens) db.refreshTokens = []
    db.refreshTokens.push({
      userId: user.id,
      token: refreshToken,
      createdAt: new Date().toISOString()
    })
    
    // Save database once after all operations
    await saveDB(db)

    return {
      success: true,
      user: { id: user.id, username: user.username, department: user.department, profile: user.profile || null },
      accessToken,
      refreshToken
    }
  })
  .post('/refresh', async ({ body, set, jwt, refreshJwt }) => {
    const { refreshToken } = body
    if (!refreshToken) {
      set.status = 400
      return { success: false, message: 'Refresh token required' }
    }

    try {
      const payload = await refreshJwt.verify(refreshToken)
      if (!payload || payload.type !== 'refresh') {
        set.status = 401
        return { success: false, message: 'Invalid refresh token' }
      }

      // Check if refresh token exists in database
      const db = await getDB()
      const tokenExists = db.refreshTokens?.some(t => t.token === refreshToken && t.userId === payload.userId)
      if (!tokenExists) {
        set.status = 401
        return { success: false, message: 'Refresh token not found' }
      }

      // Generate new access token
      const accessToken = await jwt.sign({
        userId: payload.userId,
        username: payload.username,
        type: 'access'
      })

      return { success: true, accessToken }
    } catch (error) {
      set.status = 401
      return { success: false, message: 'Invalid or expired refresh token' }
    }
  })
  .post('/logout', async ({ body }) => {
    const { refreshToken } = body
    if (refreshToken) {
      const db = await getDB()
      if (db.refreshTokens) {
        db.refreshTokens = db.refreshTokens.filter(t => t.token !== refreshToken)
        await saveDB(db)
      }
    }
    return { success: true, message: 'Logged out successfully' }
  })
  .post('/test-results', async ({ body, set, jwt, request }) => {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return { success: false, message: 'Unauthorized' }
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = await jwt.verify(token)
      if (!payload || payload.type !== 'access') {
        set.status = 401
        return { success: false, message: 'Invalid token' }
      }
    } catch (error) {
      set.status = 401
      return { success: false, message: 'Invalid or expired token' }
    }

    const { userId, answers, results } = body
    if (!userId || !answers || !results) {
      set.status = 400
      return { success: false, message: 'Missing fields' }
    }

    // Verify userId matches token (convert to number for comparison)
    if (Number(userId) !== payload.userId) {
      set.status = 403
      return { success: false, message: 'Forbidden' }
    }

    const db = await getDB()
    if (!db.testResults) {
      db.testResults = []
    }

    const testResult = {
      id: Date.now(),
      userId,
      answers,
      results,
      completedAt: new Date().toISOString()
    }

    db.testResults.push(testResult)
    await saveDB(db)

    return { success: true, testResult }
  })
  .get('/test-results/:userId', async ({ params, set, jwt, request }) => {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return { success: false, message: 'Unauthorized' }
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = await jwt.verify(token)
      if (!payload || payload.type !== 'access') {
        set.status = 401
        return { success: false, message: 'Invalid token' }
      }
    } catch (error) {
      set.status = 401
      return { success: false, message: 'Invalid or expired token' }
    }

    // Verify userId matches token
    if (parseInt(params.userId) !== payload.userId) {
      set.status = 403
      return { success: false, message: 'Forbidden' }
    }

    const db = await getDB()
    if (!db.testResults) {
      return { success: true, results: [] }
    }

    const userResults = db.testResults.filter(r => r.userId === parseInt(params.userId))
    return { success: true, results: userResults }
  })
  .get('/questions', async () => {
    const db = await getDB()
    return { success: true, questions: db.questions || [] }
  })
  .put('/users/:userId/profile', async ({ params, body, set, jwt, request }) => {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return { success: false, message: 'Unauthorized' }
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = await jwt.verify(token)
      if (!payload || payload.type !== 'access') {
        set.status = 401
        return { success: false, message: 'Invalid token' }
      }
    } catch (error) {
      set.status = 401
      return { success: false, message: 'Invalid or expired token' }
    }

    // Verify userId matches token
    if (parseInt(params.userId) !== payload.userId) {
      set.status = 403
      return { success: false, message: 'Forbidden' }
    }

    const {
      identity,
      gender,
      accountNumber,
      name,
      dateOfBirth,
      email,
      backupEmail,
      mobilePhone,
      enrollmentYear,
      enrollmentLevel,
      schoolCity,
      schoolName,
      durationOfStudy,
      departmentInstitute,
      yearClass,
      studentId
    } = body

    // Validate email format if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      set.status = 400
      return { success: false, message: 'Invalid email format' }
    }
    if (backupEmail && !emailRegex.test(backupEmail)) {
      set.status = 400
      return { success: false, message: 'Invalid backup email format' }
    }

    const db = await getDB()
    const user = db.users.find(u => u.id === parseInt(params.userId))
    
    if (!user) {
      set.status = 404
      return { success: false, message: 'User not found' }
    }

    // Update user profile
    user.profile = {
      identity: identity || null,
      gender: gender || null,
      accountNumber: accountNumber || null,
      name: name || null,
      dateOfBirth: dateOfBirth || null,
      email: email || null,
      backupEmail: backupEmail || null,
      mobilePhone: mobilePhone || null,
      enrollment: {
        year: enrollmentYear || null,
        level: enrollmentLevel || null
      },
      school: {
        city: schoolCity || null,
        name: schoolName || null
      },
      durationOfStudy: durationOfStudy || null,
      departmentInstitute: departmentInstitute || null,
      yearClass: yearClass || null,
      studentId: studentId || null,
      agreedToTerms: user.profile?.agreedToTerms || false
    }

    await saveDB(db)

    return { 
      success: true, 
      message: 'Profile updated successfully',
      user: { 
        id: user.id, 
        username: user.username, 
        department: user.department, 
        profile: user.profile 
      }
    }
  })
  .listen(3000)

console.log(`🐹 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
