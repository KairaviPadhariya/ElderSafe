pipeline {
  agent any

  stages {
    stage('Build & Deploy') {
      steps {
        sh '''
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        '''
      }
    }
  }
}
