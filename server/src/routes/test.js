import { Elysia } from 'elysia'
import mongoose from 'mongoose'
import { TestResult, User } from '../models/index.js'
import connectDB from '../config/database.js'

export const testRoutes = (jwt) => new Elysia()
  .post('/test-results', async ({ body, set }) => {
    await connectDB();

    console.log("👉 [Submit Test] Processing request...");

    const { userId, answers, results, username } = body

    if (!answers || !results) {
      set.status = 400
      return { success: false, message: 'Missing fields' }
    }

    try {
      let userIdObjectId;
      
      if (username) {
          console.log(`👉 Finding user by username: ${username}`);
          const realUser = await User.findOne({ username: username });
          
          if (realUser) {
              userIdObjectId = realUser._id;
              console.log("✅ Found real user ID:", userIdObjectId);
          }
      }

      if (!userIdObjectId) {
          console.log("⚠️ Using Random ObjectId for Demo/Anonymous user");
          userIdObjectId = new mongoose.Types.ObjectId();
      }
      
      const testResult = new TestResult({
        userId: userIdObjectId,
        answers: new Map(Object.entries(answers)),
        results: {
          topRecommendations: results.topRecommendations || [],
          categoryScores: results.categoryScores || {}
        },
        completedAt: new Date()
      })

      await testResult.save()
      console.log("✅ Saved Test Result Successfully!");

      const responseResult = {
        id: testResult._id,
        userId: testResult.userId,
        answers: Object.fromEntries(testResult.answers),
        results: testResult.results,
        completedAt: testResult.completedAt
      }

      return { success: true, testResult: responseResult }
    } catch (error) {
      console.error('❌ Save test result error:', error)
      set.status = 500
      return { success: false, message: 'Internal server error: ' + error.message }
    }
  })

  .get('/test-results/:userId', async ({ params, set }) => {
    await connectDB();

    try {
      let userIdObjectId;
      try {
        userIdObjectId = new mongoose.Types.ObjectId(params.userId)
      } catch (e) {
         return { success: true, results: [] }
      }
      
      const userResults = await TestResult.find({ userId: userIdObjectId })
        .sort({ completedAt: -1 })
        .lean()

      const formattedResults = userResults.map(result => ({
        id: result._id,
        userId: result.userId,
        answers: result.answers instanceof Map 
          ? Object.fromEntries(result.answers) 
          : result.answers,
        results: result.results,
        completedAt: result.completedAt
      }))

      return { success: true, results: formattedResults }
    } catch (error) {
      console.error('Get test results error:', error)
      set.status = 500
      return { success: false, message: 'Internal server error' }
    }
  })