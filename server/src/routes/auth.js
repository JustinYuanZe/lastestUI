import { Elysia } from 'elysia'
import bcrypt from 'bcryptjs'
import { User, RefreshToken } from '../models/index.js'
import connectDB from '../config/database.js'

const SALT_ROUNDS = 10

export const authRoutes = (jwt, refreshJwt) => new Elysia()
  .post('/register', async ({ body, set }) => {
    console.log("👉 [Register] Start request...");

    try {
        await connectDB();
        console.log("👉 [Register] DB Connection ensured.");
    } catch (dbError) {
        console.error("❌ [Register] DB Connection Failed:", dbError);
        set.status = 500;
        return { success: false, message: 'Database connection failed' };
    }

    const {
      username,
      password,
      department,
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

    console.log("👉 [Register] Validating input...");

    if (!username || !password || !department) {
      set.status = 400
      return { success: false, message: 'Missing required fields: username, password and department' }
    }

    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      set.status = 400
      return { success: false, message: 'Username must be between 3 and 50 characters' }
    }

    if (typeof password !== 'string' || password.length < 6) {
      set.status = 400
      return { success: false, message: 'Password must be at least 6 characters long' }
    }

    try {
      console.log("👉 [Register] Checking existing user...");
      const existingUser = await User.findOne({ username })
      
      if (existingUser) {
        set.status = 400
        return { success: false, message: 'Username already exists' }
      }

      console.log("👉 [Register] Hashing password...");
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

      console.log("👉 [Register] Creating user object...");
      const user = new User({
        username,
        password: hashedPassword,
        department,
        profile: {
          identity: identity || null,
          gender: gender || null,
          accountNumber: accountNumber || null,
          name: name || null,
          dateOfBirth: dateOfBirth || { year: null, month: null, day: null },
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
      })

      console.log("👉 [Register] Saving to MongoDB...");
      await user.save({ wtimeout: 25000 }); 
      console.log("👉 [Register] Saved successfully!");

      const accessToken = await jwt.sign({
        userId: user._id.toString(),
        username: user.username,
        type: 'access'
      })

      const refreshToken = await refreshJwt.sign({
        userId: user._id.toString(),
        username: user.username,
        type: 'refresh'
      })

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken
      })

      console.log("👉 [Register] Done. Sending response.");
      return {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          department: user.department,
          profile: user.profile
        },
        accessToken,
        refreshToken
      }
    } catch (error) {
      console.error('❌ [Register] Error:', error)
      set.status = 500
      return { success: false, message: 'Internal server error: ' + error.message }
    }
  })

  .post('/login', async ({ body, set }) => {
    await connectDB(); 
    
    const { username, password } = body

    if (!username || !password) {
      set.status = 400
      return { success: false, message: 'Username and password are required' }
    }

    try {
      const user = await User.findOne({ username })

      if (!user) {
        set.status = 401
        return { success: false, message: 'Invalid credentials' }
      }

      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        set.status = 401
        return { success: false, message: 'Invalid credentials' }
      }

      const accessToken = await jwt.sign({
        userId: user._id.toString(),
        username: user.username,
        type: 'access'
      })

      const refreshToken = await refreshJwt.sign({
        userId: user._id.toString(),
        username: user.username,
        type: 'refresh'
      })

      await RefreshToken.create({
        userId: user._id,
        token: refreshToken
      })

      return {
        success: true,
        user: {
          id: user._id,
          username: user.username,
          department: user.department,
          profile: user.profile || null
        },
        accessToken,
        refreshToken
      }
    } catch (error) {
      console.error('Login error:', error)
      set.status = 500
      return { success: false, message: 'Internal server error' }
    }
  })

  .post('/refresh', async ({ body, set }) => {
    await connectDB();
    const { refreshToken } = body;
    
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
       const tokenExists = await RefreshToken.findOne({
         token: refreshToken,
         userId: payload.userId
       })
       if (!tokenExists) {
         set.status = 401
         return { success: false, message: 'Refresh token not found' }
       }
       const accessToken = await jwt.sign({
         userId: payload.userId,
         username: payload.username,
         type: 'access'
       })
       return { success: true, accessToken }
    } catch (error) {
       console.error('Refresh token error:', error)
       set.status = 401
       return { success: false, message: 'Invalid or expired refresh token' }
    }
  })
  
  .post('/logout', async ({ body }) => {
    await connectDB();
    const { refreshToken } = body
    if (refreshToken) {
      try {
        await RefreshToken.deleteOne({ token: refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    return { success: true, message: 'Logged out successfully' }
  })