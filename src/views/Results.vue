<template>
  <v-container class="py-4">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <v-card class="pa-4" elevation="2">
          <v-card-title class="text-h6 text-center mb-4">
            <v-icon left color="success" size="small">mdi-chart-line</v-icon>
            {{ $t('results.title') }}
          </v-card-title>

          <div v-if="results">
            <v-card class="mb-4" elevation="3" v-if="results.aiAnalysis" color="deep-purple-darken-3" theme="dark">
              <v-card-item>
                <template v-slot:prepend>
                  <v-avatar color="white" size="40">
                    <v-icon color="deep-purple-darken-3">mdi-robot-excited</v-icon>
                  </v-avatar>
                </template>
                <v-card-title class="text-subtitle-1 font-weight-bold">AI Advisor's Insight</v-card-title>
              </v-card-item>
              <v-card-text class="pt-2 text-body-2">
                <div class="d-flex align-start">
                  <v-icon class="mr-2" size="small">mdi-format-quote-open</v-icon>
                  <p class="font-italic mb-0" style="line-height: 1.5;">
                    {{ results.aiAnalysis.summary }}
                  </p>
                  <v-icon class="ml-2 align-self-end" size="small">mdi-format-quote-close</v-icon>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mb-4" elevation="2" v-if="results.aiAnalysis && results.aiAnalysis.courses && results.aiAnalysis.courses.length > 0">
              <v-card-title class="bg-indigo-lighten-5 text-indigo-darken-4 py-2 text-subtitle-1">
                <v-icon left size="small" color="indigo">mdi-bookshelf</v-icon>
                Top Recommended Courses
              </v-card-title>
              <v-card-text class="pa-3 bg-grey-lighten-5">
                <v-row dense>
                  <v-col cols="12" md="6" v-for="course in results.aiAnalysis.courses" :key="course.code">
                    <v-card variant="elevated" elevation="1" class="h-100 course-card border-thin">
                      <v-card-item class="pa-3">
                        <div class="d-flex justify-space-between align-start mb-1">
                          <div>
                            <div class="text-caption font-weight-bold text-primary">
                              {{ course.code }}
                            </div>
                            <div class="text-body-2 font-weight-bold" style="line-height: 1.2;">
                              {{ course.name }}
                            </div>
                          </div>
                          <v-chip size="x-small" :color="course.match_score > 0.6 ? 'green' : 'blue'" class="font-weight-bold">
                            {{ Math.round(course.match_score * 100) }}%
                          </v-chip>
                        </div>
                        <v-divider class="my-2"></v-divider>
                        <div class="d-flex align-center mb-1">
                          <v-icon size="x-small" color="grey" class="mr-1">mdi-domain</v-icon>
                          <span class="text-caption text-grey-darken-2 text-truncate">
                            {{ course.department }}
                          </span>
                        </div>
                        <p class="text-caption text-grey-darken-3 course-desc mb-0">
                          {{ course.description }}
                        </p>
                      </v-card-item>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card class="mb-4" elevation="1">
              <v-card-title class="bg-success text-white py-2 text-body-1">
                <v-icon left size="small">mdi-star</v-icon>
                {{ $t('results.recommendationsTitle') }}
              </v-card-title>
              <v-card-text class="pa-0">
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel v-for="(recommendation, index) in results.topRecommendations" :key="index">
                    <v-expansion-panel-title>
                      <div class="d-flex align-center">
                        <v-chip :color="getScoreColor(index)" class="mr-3" size="small">
                          #{{ index + 1 }}
                        </v-chip>
                        <div>
                          <div class="font-weight-bold">{{ recommendation.title }}</div>
                          <div class="text-caption text-grey">
                            {{ $t('results.score') }}: {{ recommendation.score }} / {{ recommendation.maxScore }}
                          </div>
                        </div>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="pa-3">
                        <p class="mb-3 text-body-2">{{ recommendation.description }}</p>
                        <h4 class="mb-2 text-body-2 font-weight-bold">{{ $t('results.specificCareers') }}</h4>
                        <v-row dense>
                          <v-col cols="6" md="4" v-for="career in recommendation.careers" :key="career">
                            <v-chip size="small" color="grey-lighten-3" class="w-100 justify-start">
                              <v-icon start size="x-small" color="primary">mdi-briefcase</v-icon>
                              {{ career }}
                            </v-chip>
                          </v-col>
                        </v-row>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-card>

            <v-card class="mb-4" elevation="1">
              <v-card-title class="bg-info text-white py-2 text-body-1">
                <v-icon left size="small">mdi-target</v-icon>
                {{ $t('results.scoreAnalysisTitle') }}
              </v-card-title>
              <v-card-text class="pa-3">
                <div v-for="(recommendation, index) in results.topRecommendations" :key="index" class="mb-3">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-body-2">{{ recommendation.title }}</span>
                    <span class="text-body-2 font-weight-bold">{{ getPercentage(recommendation.score, recommendation.maxScore) }}%</span>
                  </div>
                  <v-progress-linear 
                    :model-value="getPercentage(recommendation.score, recommendation.maxScore)"
                    :color="getScoreColor(index)" 
                    height="6"
                  ></v-progress-linear>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mb-4" elevation="1">
              <v-card-title class="bg-orange text-white py-2 text-body-1">
                <v-icon left size="small">mdi-lightbulb</v-icon>
                {{ $t('results.developmentTitle') }}
              </v-card-title>
              <v-card-text class="pa-3">
                <v-list density="compact" class="py-0">
                  <v-list-item v-for="(tip, index) in developmentTips" :key="index" class="px-0">
                    <template v-slot:prepend>
                      <v-icon size="small" color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ tip }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <v-card-actions class="justify-center flex-wrap">
              <v-btn color="secondary" size="small" :to="{ name: 'CareerTest' }" prepend-icon="mdi-refresh" class="ma-1">
                {{ $t('results.retakeTest') }}
              </v-btn>
              <v-btn color="primary" size="small" @click="downloadResults" prepend-icon="mdi-download" class="ma-1">
                {{ $t('results.downloadResults') }}
              </v-btn>
              <v-btn color="success" size="small" :to="{ name: 'Home' }" prepend-icon="mdi-home" class="ma-1">
                {{ $t('results.goHome') }}
              </v-btn>
            </v-card-actions>
          </div>

          <div v-else class="text-center py-4">
            <v-icon color="warning" size="48">mdi-alert</v-icon>
            <h3 class="text-h6 mt-3 mb-3">{{ $t('results.noResults') }}</h3>
            <p class="text-body-2 mb-3">{{ $t('results.noResultsDesc') }}</p>
            <v-btn color="primary" size="small" :to="{ name: 'CareerTest' }" prepend-icon="mdi-clipboard-list">
              {{ $t('results.takeTest') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { auth } from '../store/auth'
import { API_URL } from '../config/api'

export default {
  name: 'Results',
  data() {
    return {
      results: null
    }
  },
  computed: {
    developmentTips() {
      if (!this.results || !this.results.topRecommendations.length) return []
      const topField = this.results.topRecommendations[0]
      const tipsKey = `results.${topField.field}Tips`
      const tips = this.$tm(tipsKey)
      return (tips && tips.length > 0) ? tips : this.$tm('results.technicalTips')
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      const savedResults = localStorage.getItem('careerResults')
      if (savedResults) {
        try {
          const parsed = JSON.parse(savedResults)
          if (parsed && parsed.aiAnalysis) {
             this.results = parsed
             return
          }
        } catch(e) {}
      }

      if (auth.isLoggedIn && auth.user && auth.accessToken) {
        try {
          const response = await fetch(`${API_URL}/test-results/${auth.user.id}`, {
            headers: { 'Authorization': auth.getAuthHeader() }
          })
          const data = await response.json()
          if (data.success && data.results.length > 0) {
            this.results = data.results[data.results.length - 1].results
          }
        } catch (error) {
          console.error(error)
        }
      }
      
      if (!this.results && savedResults) {
         this.results = JSON.parse(savedResults)
      }
    },
    getScoreColor(index) {
      const colors = ['success', 'info', 'warning', 'grey']
      return colors[index] || 'grey'
    },
    getPercentage(score, maxScore) {
      const minScore = -maxScore
      const range = maxScore - minScore
      return Math.round(((score - minScore) / range) * 100)
    },
    downloadResults() {
      if (!this.results) return
      const content = JSON.stringify(this.results, null, 2)
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `results-${new Date().toISOString().split('T')[0]}.txt`
      link.click()
    }
  }
}
</script>

<style scoped>
.course-card { transition: transform 0.2s; border: 1px solid rgba(0,0,0,0.05); }
.course-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; border-color: #3F51B5; }
.course-desc { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 4.2em; }
</style>